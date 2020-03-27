import { startWebClient } from '@aven/web-browser';
import App from './WingApp';
import { createBrowserNetworkSource } from '@aven/cloud-browser';
import { createSessionClient, CloudContext } from '@aven/cloud-core';

const networkSource = createBrowserNetworkSource({
  authority: null, // this means to inherit from the server
  useSSL: null,
});

const client = createSessionClient({
  source: networkSource,
  domain: 'pilot.aven.io',
  auth: null,
});

const context = new Map();

context.set(CloudContext, client);

startWebClient(App, context);
