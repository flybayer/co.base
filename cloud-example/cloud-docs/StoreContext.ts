import { createContext } from "react";
import { Store } from "./core";
import stringify from "json-stable-stringify";
import ReconnectingWebSocket from "reconnecting-websocket";

type StoreClient = {
  dispatch: (value: { storeId: string; key: any; action: any }) => Promise<any>;
  subscribe: (
    store: Store<any, any>,
    storeId: string,
    key: any,
    handler: (v: any) => void
  ) => () => void;
};

type ClientOptions = {};

type ClientDoc<StoreDoc> = {
  listen: (handler: (v: StoreDoc) => void) => () => void;
  _serverUpdate: ({ state }: { state: StoreDoc }) => void;
};

function createClientDoc<StoreKey, StoreDoc>(
  store: Store<StoreKey, StoreDoc>,
  send: (data: any) => void,
  storeId: string,
  key: StoreKey
): ClientDoc<StoreDoc> {
  let state: StoreDoc | undefined = undefined;
  const subscribers = new Set<(v: StoreDoc) => void>();
  let isSubscribed = false;
  function subscribe() {
    if (isSubscribed) return;
    send({ t: "sub", store: storeId, key });
    isSubscribed = true;
  }
  function unsubscribe() {
    send({ t: "unsub", store: storeId, key });
    isSubscribed = false;
  }

  function listen(handler: (v: StoreDoc) => void) {
    subscribe();
    if (state !== undefined) {
      handler(state);
    }
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
      setTimeout(() => {
        // this is a way to deprioritize the unsubscribe, and to give other components a chance to subscribe
        if (subscribers.size === 0) unsubscribe();
      }, 10);
    };
  }
  function _serverUpdate({ state: newState }: { state: StoreDoc }) {
    state = newState;
    subscribers.forEach((handler) => handler(newState));
  }
  return {
    listen,
    _serverUpdate,
  };
}

export function createClient(opts: ClientOptions): StoreClient {
  const docs: Record<string, Record<string, any>> = {};

  function handleStateUpdate(update: {
    store: string;
    key: any;
    state: any;
    docId: string;
  }) {
    const { store, key } = update;
    const storeDocs = docs[store] || (docs[store] = {});
    const docId = stringify(key);
    const doc = storeDocs[docId];
    if (!doc) {
      console.log("Unhandled server update. Doc not found", update);
      return;
    }
    doc._serverUpdate(update);
  }

  if (!global.WebSocket) {
    throw new Error("Websocket missing");
  }
  const wsClient = new ReconnectingWebSocket("ws://localhost:3000", [], {
    WebSocket: global.WebSocket,
    // debug: true,
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    minUptime: 5000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 4000,
    maxRetries: Infinity,
  });

  wsClient.onopen = () => {
    console.log("DID CONNECT!");
  };

  function handleMessage(payload: any) {
    if (payload.t === "state") return handleStateUpdate(payload);
    console.log("unknown server message", payload);
  }

  wsClient.onmessage = (msg: MessageEvent) => {
    const payload = JSON.parse(msg.data);
    handleMessage(payload);
  };
  function send(data: any) {
    wsClient.send(JSON.stringify(data));
  }

  async function dispatch(payload: {
    storeId: string;
    key: any;
    action: any;
  }): Promise<any> {
    const res = await fetch("/dispatch", {
      method: "post",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const resp = res.json();
    return resp;
  }
  function subscribe<StoreKey, StoreDoc>(
    store: Store<StoreKey, StoreDoc>,
    storeId: string,
    key: any,
    handler: (v: any) => void
  ) {
    const storeDocs = docs[storeId] || (docs[storeId] = {});
    const docId = stringify(key);
    const doc =
      storeDocs[docId] ||
      (storeDocs[docId] = createClientDoc<StoreKey, StoreDoc>(
        store,
        send,
        storeId,
        key
      ));
    return doc.listen(handler);
  }
  return {
    dispatch,
    subscribe,
  };
}

const StoreContext = createContext<StoreClient>(createClient({}));

export default StoreContext;
