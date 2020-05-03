import App from './StageApp';
import { createCloud } from '@aven/cloud-core';
import { startPostgresStorageSource } from '@aven/cloud-postgres';
import { attachWebServer } from '@aven/web-server';
import { createEmailAuthProvider } from '@aven/cloud-auth-email';
import { createSMSAuthProvider } from '@aven/cloud-auth-sms';
import { createProtectedSource } from '@aven/cloud-auth';
import { EmailAgent } from '@aven/email-agent-sendgrid';
import { SMSAgent } from '@aven/sms-agent-twilio';
import * as appConfig from './app.json';
import dotenv from 'dotenv';

dotenv.config();

const serverListenLocation = process.env.LISTEN_PATH || '8080';

export default async function runServer() {
  const storageSource = await startPostgresStorageSource({
    domains: [appConfig.domain],
    config: {
      client: 'pg',
      connection: {
        ssl: process.env.AVEN_SQL_USE_SSL
          ? {
              rejectUnauthorized: false,
            }
          : false,
        user: process.env.AVEN_SQL_USER,
        password: process.env.AVEN_SQL_PASSWORD,
        database: process.env.AVEN_SQL_DATABASE,
        host: process.env.AVEN_SQL_HOST,
        port: Number(process.env.AVEN_SQL_PORT),
      },
    },
  });

  const storageCloud = createCloud({
    source: storageSource,
    domain: appConfig.domain,
    auth: null,
  });

  const emailAgent = EmailAgent({
    defaultFromEmail: 'StageCast <admin@stageca.st>',
    config: {
      sendgridAPIKey: process.env.STAGECAST_SENDGRID_API_KEY,
    },
  });

  const smsAgent = SMSAgent({
    defaultFromNumber: process.env.STAGECAST_TWILIO_FROM_NUMBER,
    config: {
      accountSid: process.env.STAGECAST_TWILIO_ACCOUNT_SID,
      authToken: process.env.STAGECAST_TWILIO_AUTH_TOKEN,
    },
  });

  const emailAuthProvider = createEmailAuthProvider({
    agent: emailAgent,
    getMessage: async (authCode, verifyInfo, accountId) => {
      const subject = 'Welcome to StageCast';

      const message = `To log in, your code is ${authCode}. Or, click the link: http://localhost:8080/auth/login?method=email&email=${
        verifyInfo.email
      }&code=${authCode}`;

      return { subject, message };
    },
  });

  const smsAuthProvider = createSMSAuthProvider({
    agent: smsAgent,
    getMessage: (authCode, verifyInfo, accountId) => {
      return `auth code is: ${authCode}`;
    },
  });

  const protectedCloud = createProtectedSource({
    source: storageCloud,
    providers: [emailAuthProvider, smsAuthProvider],
    staticPermissions: {
      [appConfig.domain]: {
        Content: {
          children: {
            defaultRule: { canRead: true },
          },
        },
      },
    },
  });

  const webService = await attachWebServer({
    App,
    source: protectedCloud,
    appConfig,
    serverListenLocation,
  });

  return {
    close: async () => {
      await webService.close();
      await storageCloud.close();
      await protectedCloud.close();
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
