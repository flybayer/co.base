import { createNetworkSource } from '@aven/cloud-network';

const fetchFn = global.fetch && global.fetch.bind(global);

export default function createBrowserNetworkSource(opts) {
  return createNetworkSource({
    WebSocket: undefined,
    fetchFn,
    ...opts,
  });
}
