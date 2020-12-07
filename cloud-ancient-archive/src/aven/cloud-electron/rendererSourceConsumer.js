import { streamOf, createProducerStream } from '@aven/stream';
import { log } from '@aven/logger';

const { ipcRenderer } = window.require('electron');

let idIndex = 0;
const idBase = Date.now();
function getClientId() {
  idIndex += 1;
  return idBase + idIndex;
}

export default function rendererSourceConsumer(channelId) {
  const dispatchResponders = {};
  async function dispatch(action) {
    const resp = ipcRenderer.sendSync(`${channelId}-Cloud-Dispatch`, action);
    const responder = {};
    dispatchResponders[resp.dispatchId] = responder;
    return new Promise((resolve, reject) => {
      responder.resolve = resolve;
      responder.reject = reject;
    });
  }

  const subscriptions = {};

  function subscribeStream(subsSpec) {
    let id = getClientId();
    return createProducerStream({
      crumb: { type: 'NetworkStream', spec: subsSpec },
      start: listener => {
        const finalSpec = { ...subsSpec, id };
        ipcRenderer.send(`${channelId}-Cloud-Subscribe`, {
          subscriptions: [finalSpec],
        });
        subscriptions[id] = {
          spec: finalSpec,
          observer: listener,
        };
      },
      stop: () => {
        ipcRenderer.send(`${channelId}-Cloud-Unsubscribe`, {
          subscriptionIds: [id],
        });
        delete subscriptions[id];
      },
    });
  }

  ipcRenderer.on(`${channelId}-Cloud-DispatchResponse`, (evt, action) => {
    const responder = dispatchResponders[action.dispatchId];
    delete dispatchResponders[action.dispatchId];
    if (responder && action.response) {
      responder.resolve(action.response);
    } else if (responder && action.error) {
      responder.reject(error);
    }
  });
  ipcRenderer.on(`${channelId}-Cloud-SubscriptionNext`, (evt, action) => {
    const { id, value } = action;
    subscriptions[id] &&
      subscriptions[id].observer &&
      subscriptions[id].observer.next(value);
  });
  ipcRenderer.on(`${channelId}-Cloud-SubscriptionError`, (evt, action) => {
    const { id, error } = action;
    const observer = subscriptions[id] && subscriptions[id].observer;
    if (!observer) {
      return;
    }
    log('🚨', error);
    observer.error(new Err(error.message, error.type, error.detail));
  });

  function getDocStream(domain, name, auth) {
    return subscribeStream({ domain, auth, doc: name });
  }

  function getDocChildrenEventStream(domain, name, auth) {
    return subscribeStream({ domain, auth, docChildren: name });
  }

  const [isConnectedStream] = streamOf(true);
  const source = {
    dispatch,

    id: `electron-client-${channelId}`,

    getDocStream,
    getDocChildrenEventStream,
    connected: isConnectedStream,

    close: () => {
      // todo, detach?
    },
  };
  return source;
}
