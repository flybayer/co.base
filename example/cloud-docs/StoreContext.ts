import { createContext } from "react";
import { Store } from "./core";

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
};

function createClientDoc<StoreKey, StoreDoc>(
  store: Store<StoreKey, StoreDoc>,
  storeId: string,
  key: StoreKey
): ClientDoc<StoreDoc> {
  function listen(handler: (v: StoreDoc) => void) {
    return () => {};
  }
  return {
    listen,
  };
}

export function createClient(opts: ClientOptions): StoreClient {
  const docs: Record<string, Record<string, any>> = {};
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

const StoreContext = createContext<StoreClient | null>(null);

export default StoreContext;
