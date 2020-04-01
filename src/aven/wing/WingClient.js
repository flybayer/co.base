import { startWebClient } from '@aven/web-browser';
import App from './WingApp';
import { createBrowserNetworkSource } from '@aven/cloud-browser';
import { createClient, CloudContext } from '@aven/cloud-core';
import * as appConfig from './app.json';

const networkSource = createBrowserNetworkSource({
  authority: null, // this means to inherit from the server
  useSSL: null,
});

const client = createClient({
  source: networkSource,
  domain: appConfig.domain,
});

const context = new Map();

context.set(CloudContext, client);

startWebClient(App, context);
