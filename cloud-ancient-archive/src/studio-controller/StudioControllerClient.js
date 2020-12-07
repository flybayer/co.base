import App from './StudioControllerApp';
import renderApp from '@aven/electron/renderApp';
import { createCloud } from '@aven/cloud-core';
import rendererSourceConsumer from '@aven/cloud-electron/rendererSourceConsumer';

const source = rendererSourceConsumer('StudioSource');

const cloud = createCloud({
  domain: 'studio.aven.io',
  source,
});

renderApp(App, { cloud });
