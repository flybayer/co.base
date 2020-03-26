import App from './PilotWebApp';
import { createSessionClient } from '@aven/cloud-core';
import { startFSStorageSource } from '@aven/cloud-fs';
import { attachWebServer } from '@aven/web-server';

const appConfig = require('./app.json');
const homedir = require('os').homedir();

const serverListenLocation = process.env.LISTEN_PATH || '8080';

export default async function runServer() {
  const storageSource = await startFSStorageSource({
    domain: 'pilot.aven.io',
    dataDir: homedir + '/db',
  });

  const source = createSessionClient({
    source: storageSource,
    domain: 'todo.aven.io',
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
