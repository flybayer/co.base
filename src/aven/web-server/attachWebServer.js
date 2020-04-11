import express from 'express';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from '@rn';
import React from 'react';
import { attachSourceServer } from '@aven/cloud-server';
import { CloudContext } from '@aven/cloud';
import { createClient } from '@aven/cloud-core';
import { NavigationContext } from '@aven/navigation-core';
import { handleServerRequest } from '@aven/navigation-web-server';
import getAssetManifest from './getAssetManifest';
import { Buffer } from '@aven/utils';
import { trace, error } from '@aven/logger';

const yes = require('yes-https');
const helmet = require('helmet');
const path = require('path');
const mime = require('mime');

const isProd = process.env.NODE_ENV === 'production';

const sendNotFound = res => {
  res.status(404);
  res.send('Not found');
};

async function blockResponse({
  domain,
  docName,
  dispatch,
  docPath,
  blockId,
  blockName,
}) {
  const block = await dispatch({
    type: 'GetBlock',
    domain,
    name: docName,
    id: blockId,
  });
  if (!block) {
    return sendNotFound;
  }
  if (docPath === '/' || docPath === '') {
    if (!block.value || !block.value.data) {
      // should be checking for some type here, rather than looking at "data"..
      return res => {
        res.send(block.value);
      };
    }
    return res => {
      const resultBinary = Buffer.from(block.value.data, 'hex');
      res.type(block.value.contentType);
      res.send(resultBinary);
    };
  }
  if (!block.value || !block.value.files) {
    return sendNotFound;
  }
  const pathParts = docPath.split('/');
  const pathTermName = pathParts[1];
  if (block.value.files[pathTermName]) {
    const childDocPath = `/${pathParts.slice(2).join('/')}`;
    const childId = block.value.files[pathTermName].id;
    return await blockResponse({
      domain,
      docName,
      dispatch,
      blockName: pathTermName,
      blockId: childId,
      docPath: childDocPath,
    });
  }
  return sendNotFound;
}

async function webDataInterface({ domain, address, dispatch, docPath }) {
  let blockId = null;
  let docName = null;
  const blockIdMatch = address.match(/^(.*):(.*)$/);
  if (blockIdMatch) {
    docName = blockIdMatch[1];
    blockId = blockIdMatch[2];
  } else {
    docName = address;
    const doc = await dispatch({
      type: 'GetDoc',
      domain,
      name: docName,
    });
    if (!doc || !doc.id) {
      return sendNotFound;
    }
    blockId = doc.id;
  }
  return await blockResponse({
    domain,
    docName,
    dispatch,
    blockName: docName,
    blockId,
    docPath,
  });
}

const devErrorSupresser = `
<script>
// catch errors for suppression before the React dev tools can
window.addEventListener('error', function(evt) {
  if (evt.error.suppressInDevTools) {
    evt.stopImmediatePropagation();
    evt.preventDefault();
  }
});
</script>
`;

const DEFAULT_PUB_DIR = __DEV__
  ? null
  : path.join(__dirname, '../../../public');

export default async function attachWebServer({
  httpServer,
  App,
  source,
  context,
  serverListenLocation,
  expressRouting = undefined,
  fallbackExpressRouting = undefined,
  sourceDomain,
  domainAppOverrides,
  augmentRequestDispatchAction,
  appConfig,
  screenProps,
  publicDir = DEFAULT_PUB_DIR,
}) {
  const clientBundlePath = __DEV__
    ? `http://localhost:8081/src/${appConfig.name}/${appConfig.clientEntry}.bundle?platform=web`
    : '/main.js';
  let appIdCount = 0;
  function registerDomainApp(DomainApp) {
    const appId = `App${appIdCount}`;
    appIdCount += 1;
    AppRegistry.registerComponent(appId, () => {
      function AppWithContext(props) {
        let el = <DomainApp {...props} />;
        context &&
          context.forEach((value, C) => {
            el = <C.Provider value={value}>{el}</C.Provider>;
          });
        el = <CloudContext.Provider value={source}>{el}</CloudContext.Provider>;
        el = (
          <NavigationContext.Provider value={props.navigation}>
            {el}
          </NavigationContext.Provider>
        );
        if (props.cloudClient) {
          el = (
            <CloudContext.Provider value={props.cloudClient}>
              {el}
            </CloudContext.Provider>
          );
        }
        return el;
      }
      return AppWithContext;
    });
    return {
      appId,
      AppComponent: DomainApp,
    };
  }

  const defaultApp = registerDomainApp(App);

  const appsByDomain = domainAppOverrides
    ? Object.fromEntries(
        Object.entries(domainAppOverrides).map(([domainName, domainApp]) => {
          return [domainName, registerDomainApp(domainApp)];
        }),
      )
    : {};
  const assetsJSON = await getAssetManifest();
  function doExpressRouting(app) {
    expressRouting && expressRouting(app);
    process.env.ENFORCE_HTTPS && app.use(yes());
    app.use(helmet());
    app.use((req, res, next) => {
      trace('HttpRequest', {
        method: req.method,
        host: req.headers.host,
        path: req.path,
      });
      next();
    });
    app.use(function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
      );
      next();
    });

    app.disable('x-powered-by');
    if (Array.isArray(publicDir)) {
      publicDir.forEach(iPublicDir => {
        iPublicDir && app.use(express.static(iPublicDir));
      });
    } else if (publicDir !== null) {
      app.use(express.static(publicDir));
    }
  }
  function doFallbackExpressRouting(app) {
    fallbackExpressRouting && fallbackExpressRouting(app);

    app.get('/_/:domain/:address*', (req, res) => {
      const address = req.params.address;
      const domain = req.params.domain;
      const docPath = req.params['0'];

      webDataInterface({
        domain,
        address,
        docPath,
        dispatch: source.dispatch,
      })
        .then(responder => {
          responder(res);
        })
        .catch(e => {
          res.status(500);
          error('WebDataInterfaceError', {
            domain,
            address,
            docPath,
            error: e,
          });
          res.send(JSON.stringify(e.toJSON ? e.toJSON() : e));
        });
    });

    app.get('/*', (req, res) => {
      const { path, query, headers } = req;
      const domain = headers.host;
      let avenClientState = {};
      headers.cookie &&
        headers.cookie.split(';').find(cookieStr => {
          const match = cookieStr.match(/AvenClient=([^;]*)/);
          if (match) {
            avenClientState = JSON.parse(decodeURIComponent(match[1]));
          }
        });
      const cloudClient = createClient({
        source,
        domain: sourceDomain,
        initialClientState: avenClientState,
        onClientState: state => {
          res.cookie('AvenClient', encodeURIComponent(JSON.stringify(state)));
        },
      });
      const domainApp = appsByDomain[domain] || defaultApp;
      const router = domainApp.AppComponent.router;
      const requestScreenProps = { ...screenProps, cloud: cloudClient };
      handleServerRequest(router, path, query, requestScreenProps)
        .then(({ navigation, title, options, dataPayload }) => {
          const { element, getStyleElement } = AppRegistry.getApplication(
            domainApp.appId,
            {
              initialProps: {
                navigation,
                cloudClient,
                env: 'server',
              },
            },
          );

          const html = ReactDOMServer.renderToString(element);
          const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());

          res.send(
            `<!doctype html>
        <html lang="">
        <head>
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <meta charSet='utf-8' />
            <title>${title}</title>
            <style id="root-stylesheet">
            html, body, #root {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            input, textarea {
              -webkit-appearance: none;
              -webkit-border-radius: 0;
            }
            ${options.customCSS ? options.customCSS : ''}
            </style>
            ${options.customHTMLHeaders ? options.customHTMLHeaders : ''}
            ${isProd ? '' : devErrorSupresser}
            ${css}
            
        </head>
        <body>
            <div id="root">${html}</div>
            ${options.customHTML || ''}
            ${
              assetsJSON
                ? `<script>
                window.rnAssets = ${JSON.stringify(assetsJSON)};
                </script>`
                : ''
            }
            ${
              isProd
                ? `<script src="${clientBundlePath}" defer></script>`
                : `<script src="${clientBundlePath}" defer crossorigin></script>`
            }
            ${
              dataPayload
                ? `<script>window.remotePayload = ${JSON.stringify(
                    dataPayload,
                  )};</script>`
                : ''
            }
        </body>
    </html>`,
          );
        })
        .catch(err => {
          console.error(err);
          res.status(500).send(err.message);
        });
    });
  }
  return await attachSourceServer({
    httpServer,
    source,
    listenLocation: serverListenLocation,
    expressRouting: doExpressRouting,
    fallbackExpressRouting: doFallbackExpressRouting,
    augmentRequestDispatchAction,
  });
}
