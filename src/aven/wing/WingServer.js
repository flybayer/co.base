import App from './WingApp';
import { createSessionClient } from '@aven/cloud-core';
import { startFSStorageSource } from '@aven/cloud-fs';
import { attachWebServer } from '@aven/web-server';
import { createEmailAuthProvider } from '@aven/cloud-auth-email';
import { createProtectedSource } from '@aven/cloud-auth';
import { EmailAgent } from '@aven/email-agent-sendgrid';
import { SMSAgent } from '@aven/sms-agent-twilio';
import * as appConfig from './app.json';

const appConfig = require('./app.json');
const homedir = require('os').homedir();

const serverListenLocation = process.env.LISTEN_PATH || '8080';

export default async function runServer() {
  const storageSource = await startFSStorageSource({
    domain: appConfig.domain,
    dataDir: homedir + '/db',
  });

  const privateCloud = createSessionClient({
    source: storageSource,
    domain: appConfig.domain,
    auth: null,
  });

  const emailAgent = EmailAgent({
    defaultFromEmail: 'Aven Support <admin@aven.io>',
    config: {
      sendgridAPIKey: process.env.SENDGRID_API_KEY,
    },
  });

  const smsAgent = SMSAgent({
    defaultFromNumber: process.env.TWILIO_FROM_NUMBER,
    config: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
    },
  });

  const emailAuthProvider = createEmailAuthProvider({
    agent: emailAgent,
    getMessage: async (authCode, verifyInfo, accountId) => {
      const subject = 'Welcome to Aven';

      const message = `To log in, your code is ${authCode}`;

      return { subject, message };
    },
  });

  const source = createProtectedSource({
    source: privateCloud,
    providers: [emailAuthProvider],
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
