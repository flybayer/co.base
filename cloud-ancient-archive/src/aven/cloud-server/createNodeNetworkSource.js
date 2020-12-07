import { createNetworkSource } from '@aven/cloud-network';

const WebSocket = require('ws');
const fetch = require('node-fetch');

export default function createNativeNetworkSource(opts) {
  return createNetworkSource({
    WebSocket,
    fetchFn: fetch,
    ...opts,
  });
}
