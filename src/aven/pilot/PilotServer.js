import App from './PilotApp';
import { createCloud } from '@aven/cloud-core';
import { startFSStorageSource } from '@aven/cloud-fs';
import { attachWebServer } from '@aven/web-server';
import * as appConfig from './app.json';

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

  const webService = await attachWebServer({
    App,
    source,
    appConfig,
    serverListenLocation,
  });

  return {
    close: async () => {
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
