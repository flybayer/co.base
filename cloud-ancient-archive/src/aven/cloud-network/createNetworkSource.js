import ReconnectingWebSocket from 'reconnecting-websocket';
import { Err } from '@aven/utils';
import { streamOf, createProducerStream } from '@aven/stream';

let idIndex = 0;
const idBase = Date.now();
function getClientId() {
  idIndex += 1;
  return idBase + idIndex;
}

export default function createNetworkSource(opts) {
  const quiet = opts.quiet || false;
  const log = (...data) => {
    !quiet && console.log(...data);
  };

  const httpEndpoint = `${opts.useSSL === false ? 'http' : 'https'}://${
    opts.authority
  }/dispatch`;
  const wsEndpoint = `${opts.useSSL === false ? 'ws' : 'wss'}://${
    opts.authority
  }`;
  const [isConnectedStream, updateIsConnected] = streamOf(false);

  let ws = null;

  let wsClientId = null;

  async function dispatch(action) {
    let res = null;
    try {
      res = await opts.fetchFn(httpEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });
    } catch (e) {
      console.error(e);
      console.error(action);
      throw new Err('Server Connection Error', 'NetworkConnection', {});
    }

    if (res.status >= 400) {
      let result = await res.text();
      try {
        result = result.length ? JSON.parse(result) : null;
      } catch (e) {
        // fine! plaintext error. (see if I care!)
      }
      log('📣', action);
      log('🚨', result);
      throw new Err(result.message, result.name, result.detail);
    }
    let result = await res.text();
    try {
      result = result.length ? JSON.parse(result) : null;
    } catch (e) {
      throw new Err('Expecting JSON but could not parse: ' + result);
    }
    log('📣', action);
    log('💨', result);

    return result;
  }

  function socketSendIfConnected(payload) {
    if (ws && ws.readyState === ReconnectingWebSocket.OPEN) {
      log('📣', payload);
      ws.send(JSON.stringify({ ...payload, clientId: wsClientId }));
    } else {
      log('Cannot send message to closed WebSocket:', payload);
    }
  }

  const subscriptions = {};

  function subscribeStream(subsSpec) {
    let id = getClientId();
    return createProducerStream({
      crumb: { type: 'NetworkStream', spec: subsSpec },
      start: listener => {
        const finalSpec = { ...subsSpec, id };
        socketSendIfConnected({
          type: 'Subscribe',
          subscriptions: [finalSpec],
        });
        subscriptions[id] = {
          spec: finalSpec,
          observer: listener,
        };
      },
      stop: () => {
        socketSendIfConnected({
          type: 'Unsubscribe',
          subscriptionIds: [id],
        });
        delete subscriptions[id];
      },
    });
  }

  function connectWS() {
    if (ws) {
      throw new Err('ws already here!');
    }
    ws = new ReconnectingWebSocket(wsEndpoint, [], {
      // debug: true,
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      minUptime: 5000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 4000,
      maxRetries: Infinity,
      WebSocket: opts.WebSocket,
    });

    wsClientId = null;
    ws.onopen = () => {
      // actually we're going to wait for the server to say hello with ClientId
    };
    ws.onclose = e => {
      updateIsConnected(false);
      !quiet && log('Socket closed.');
    };
    ws.onerror = e => {
      updateIsConnected(false);
      !quiet &&
        log('Socket errored: ', {
          message: e.message,
          ...e,
        });
    };
    ws.onmessage = msg => {
      const evt = JSON.parse(msg.data);
      !quiet && log('💨', evt);

      switch (evt.type) {
        case 'ClientId': {
          wsClientId = evt.clientId;
          updateIsConnected(true);
          const subscriptionIds = Object.keys(subscriptions);
          subscriptionIds.length &&
            socketSendIfConnected({
              type: 'Subscribe',
              subscriptions: subscriptionIds.map(subsId => {
                const { spec } = subscriptions[subsId];
                return spec;
              }),
            });
          !quiet && log('Socket connected with client id: ', wsClientId);
          return;
        }
        case 'SubscriptionNext': {
          const { id, value } = evt;
          subscriptions[id] &&
            subscriptions[id].observer &&
            subscriptions[id].observer.next(value);
          return;
        }
        case 'SubscriptionError': {
          const { id, error } = evt;
          const observer = subscriptions[id] && subscriptions[id].observer;
          if (!observer) {
            return;
          }
          log('🚨', error);
          observer.error(new Err(error.message, error.type, error.detail));
          return;
        }
        default: {
          !quiet && log('Unknown ws event:', evt);
          return;
        }
      }
    };
  }

  connectWS();

  function getDocStream(domain, name, auth) {
    return subscribeStream({ domain, auth, doc: name });
  }

  function getDocChildrenEventStream(domain, name, auth) {
    return subscribeStream({ domain, auth, docChildren: name });
  }

  return {
    dispatch,

    id: `network-${opts.authority}`,

    getDocStream,
    getDocChildrenEventStream,
    connected: isConnectedStream,

    close: () => {
      ws && ws.close();
      ws = null;
      // todo, detach webocket
    },
  };
}
