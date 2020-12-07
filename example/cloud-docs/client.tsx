import { useEffect, createContext, useMemo, useContext, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import WS from "ws";
import stringify from "json-stable-stringify";
import { Doc } from "./core";

function createClientStore(
  docs,
  updateHandlers,
  send,
  dispatch,
  storeId,
  store
) {
  const clientStore = (key) => {
    const subscribers = new Set<any>();
    let isSubscribed = false;
    let state = undefined;
    const docId = stringify(key);
    if (docs[storeId][docId]) {
      return docs[storeId][docId];
    }
    function updateState(s) {
      state = s;
      subscribers.forEach((subs) => {
        subs(s);
      });
    }
    function subscribe() {
      if (isSubscribed) return;
      isSubscribed = true;
      updateHandlers[storeId].set(docId, updateState);
      send({ t: "sub", store: storeId, key });
    }
    function unsubscribe() {
      send({ t: "unsub", store: storeId, key });
      updateHandlers[storeId].delete(docId);
      isSubscribed = false;
    }
    const clientDoc = {
      listen: (handle) => {
        subscribers.add(handle);
        subscribe();
        handle(state);
        return () => {
          subscribers.delete(handle);
          setTimeout(() => {
            // this is a way to deprioritize the unsubscribe, and to give other components a chance to subscribe
            if (subscribers.size === 0) unsubscribe();
          }, 10);
        };
      },
      actions: Object.fromEntries(
        store.actions.map((actionName) => {
          function dispatchAction(payload) {
            dispatch({
              action: payload,
              type: actionName,
              store: storeId,
              key,
            });
          }
          Object.defineProperty(dispatchAction, "name", {
            value: `${actionName}_dispatch`,
          });
          return [actionName, dispatchAction];
        })
      ),
    };
    docs[storeId][docId] = clientDoc;
    return clientDoc;
  };
  // for debugging purposes, set a more descriptive name for this store:
  Object.defineProperty(clientStore, "name", { value: `${storeId}_client` });
  return clientStore;
}

function createClient(stores: any, options: {}) {
  if (!global.WebSocket) {
    return null;
  }
  const wsClient = new ReconnectingWebSocket("ws://localhost:3000", [], {
    WebSocket: global.WebSocket || WS,
    // debug: true,
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    minUptime: 5000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 4000,
    maxRetries: Infinity,
  });

  function dispatch(payload) {
    fetch("/dispatch", {
      method: "post",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(() => {})
      .catch((e) => {
        console.error(e);
      });
  }

  wsClient.onopen = () => {
    console.log("DID CONNECT!");
  };
  const docs = Object.fromEntries(
    Object.entries(stores).map(([storeId, _]) => {
      return [storeId, {}];
    })
  );
  const updateHandlers = Object.fromEntries(
    Object.entries(stores).map(([storeId, _]) => {
      return [storeId, new Map()];
    })
  );
  function handleStateUpdate({ store, key, state, docId }) {
    const handlers = updateHandlers[store];
    if (!handlers) {
      console.log("Unhandled server update. Store handlers not found", {
        store,
        key,
        docId,
      });
      return;
    }
    const stateHandler = handlers.get(docId);
    if (!stateHandler) {
      console.log("Unhandled server update. Doc handlers not found", {
        store,
        key,
        docId,
      });
      return;
    }
    console.log("HAndled new state", state, docId);
    stateHandler(state);
  }

  function handleMessage(payload) {
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

  const client = Object.fromEntries(
    Object.entries(stores).map(([storeId, store]) => {
      return [
        storeId,
        createClientStore(docs, updateHandlers, send, dispatch, storeId, store),
      ];
    })
  );
  return client;
}

const defaultClient = null;

export const DocContext = createContext<any>(defaultClient);

export function DocProvider({
  children,
  stores,
}: React.PropsWithChildren<{ stores: any }>) {
  const client = useMemo(() => createClient(stores, {}), []);
  return <DocContext.Provider value={client}>{children}</DocContext.Provider>;
}
