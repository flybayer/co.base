import { startWebClient } from '@aven/web-browser';
import App from './PilotApp';
import { createBrowserNetworkSource } from '@aven/cloud-browser';
import { createCloud, CloudContext } from '@aven/cloud-core';
import * as appConfig from './app.json';

const networkSource = createBrowserNetworkSource({
  authority: null, // this means to inherit from the server
  useSSL: null,
});

const cloud = createCloud({
  source: networkSource,
  domain: appConfig.domain,
  auth: null,
});

const context = new Map();

context.set(CloudContext, cloud);

startWebClient(App, context);
