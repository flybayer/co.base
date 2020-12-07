import { createNetworkSource } from '@aven/cloud-network';

const fetchFn = global.fetch && global.fetch.bind(window);

export default function createBrowserNetworkSource(opts) {
  if (opts.authority === null) {
    opts.authority = window.location.host;
  }
  if (opts.useSSL === null) {
    opts.useSSL = window.location.protocol.indexOf('s') !== -1;
  }
  return createNetworkSource({
    WebSocket: undefined,
    fetchFn,
    ...opts,
  });
}
