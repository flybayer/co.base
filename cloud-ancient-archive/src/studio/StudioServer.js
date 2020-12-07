import { createCloud } from '@aven/cloud-core';
import { startFSStorageSource } from '@aven/cloud-fs';
import { attachWebServer } from '@aven/web-server';
import * as appConfig from './app.json';
import createVSwitch from './VSwitch';
import createVDeck from './VDeck';
import createHue from './Hue';
import { createDispatcher } from '@aven/utils';

const homedir = require('os').homedir();

const serverListenLocation = process.env.LISTEN_PATH || '8080';

export default async function runServer() {
  const storageSource = await startFSStorageSource({
    domain: appConfig.domain,
    dataDir: homedir + '/db',
  });

  const source = createCloud({
    source: storageSource,
    domain: appConfig.domain,
    auth: null,
  });

  const vSwitch = createVSwitch({
    source,
    host: '10.10.10.99',
    docName: 'StudioVSwitch',
  });

  const vDeck = createVDeck({
    source,
    host: '10.10.10.109',
    docName: 'StudioVDeck',
  });

  const hue = createHue({
    source,
    apiKey: 'EhtcXGJINcHP0U4p9i7rkfZltMxkuaQrHzstHwi9',
    host: '10.10.10.60',
    docName: 'StudioHue',
  });

  const webService = await attachWebServer({
    source: {
      ...source,
      dispatch: createDispatcher(
        {
          ...vSwitch.actions,
          ...vDeck.actions,
        },
        source.dispatch,
      ),
    },
    appConfig,
    serverListenLocation,
  });

  return {
    close: async () => {
      await vSwitch.close();
      await vDeck.close();
      await webService.close();
      await source.close();
    },
  };
}
if (require.main === module) {
  runServer()
    .then(({ close }) => {
      process.on('SIGINT', () => {
        close()
          .then(() => {
            console.log('Server Closed');
            process.exit(0);
          })
          .catch(err => {
            console.error('Error closing server');
            console.error(err);
            process.exit(1);
          });
      });
    })
    .catch(err => {
      console.error('Error running server');
      console.error(err);
      process.exit(1);
    });
}
