import express from 'express';
import startServer from './startServer';
import attachSourceSocketServer from './attachSourceSocketServer';
import { log, trace, error } from '@aven/logger';
const http = require('http');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const WebSocket = require('ws');

global.__DEV__ = process.env.NODE_ENV !== 'production';

async function uploadFile(source, file, meta) {
  const result = await source.dispatch({
    type: 'PutBlock',
    domain: meta.domain,
    auth: meta.auth,
    name: meta.docName,
    value: {
      contentType: file.mimetype,
      type: 'BinaryFileHex',
      data: file.data.toString('hex'),
    },
  });
  return {
    fileName: file.name,
    fileData: {
      type: 'BlockReference',
      ...result,
    },
  };
}

async function uploadFiles(source, files, meta) {
  const results = await Promise.all(
    Object.values(files).map(file => uploadFile(source, file, meta)),
  );
  return results;
}

export default async function attachSourceServer({
  httpServer,
  source,
  listenLocation,
  expressRouting = undefined,
  fallbackExpressRouting = undefined,
  augmentRequestDispatchAction = undefined,
}) {
  const expressApp = express();
  const jsonParser = bodyParser.json({ limit: '11mb' });

  expressRouting && expressRouting(expressApp);

  expressApp.post(
    '/upload',
    fileUpload({
      limits: { fileSize: 1 * 1024 * 1024 },
    }),
    (req, res, next) => {
      const meta = JSON.parse(req.body.metadata);
      uploadFiles(source, req.files, meta)
        .then(results => {
          res.send(JSON.stringify(results));
        })
        .catch(err => {
          console.error(err);
          error('FileUploadError', { error: err });
          res.status(500).send(JSON.stringify({ error: String(err) }));
        });
    },
  );
  expressApp.post(
    '/dispatch',
    (req, res, next) => {
      if (req.socket.bytesRead > 1e7) {
        error('LargeJSON', {
          limit: 1e7,
          bytes: req.socket.bytesRead,
        });
      }
      next();
    },
    jsonParser,
    (req, res) => {
      let actionToDispatch = req.body;
      if (augmentRequestDispatchAction) {
        actionToDispatch = augmentRequestDispatchAction(req, actionToDispatch);
      }
      trace('SourceDispatchStart', { action: actionToDispatch });
      source
        .dispatch(actionToDispatch)
        .then(result => {
          if (result === undefined) {
            return res.send({});
          }
          res.send(result);
        })
        .catch(err => {
          const errorData = {
            message: String(err),
            name: err.name,
            detail: err.detail,
          };
          error('SourceDispatchError', {
            action: actionToDispatch,
            error: errorData,
          });
          res.status(500).send(JSON.stringify(errorData));
        });
    },
  );

  fallbackExpressRouting && fallbackExpressRouting(expressApp);

  let outputServer = httpServer;
  if (outputServer) {
    outputServer.on('request', expressApp);
    console.log('attaching to existing http server..');
  } else {
    const freshHttpServer = http.createServer(expressApp);
    outputServer = freshHttpServer;
    await startServer(freshHttpServer, listenLocation);

    log('ServerStarted', { listenLocation, host: process.env.HOST });
  }

  const wss = new WebSocket.Server({ server: outputServer });

  const wsServer = await attachSourceSocketServer(wss, source);

  return {
    httpServer: outputServer,
    close: async () => {
      // warning.. actual http server must be closed independently! this is because of HMR behavior on the server
      outputServer.removeListener('request', expressApp);

      wsServer && wsServer.close();
    },
  };
}
