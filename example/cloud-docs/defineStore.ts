import { Doc, Store } from "./core";
import createDoc from "./createDoc";

const stringify = require("json-stable-stringify");

export default function defineStore<StoreKey, StoreDoc>(
  storeId: string,
  { actions }: { actions: any }
): Store<StoreKey, StoreDoc> {
  const docs = {};
  function getDoc(key: StoreKey): Doc<StoreDoc> {
    const docId: string = stringify(key);
    if (docs[docId]) {
      return docs[docId];
    }
    docs[docId] = createDoc<StoreDoc>(actions);
    return docs[docId];
  }
  return {
    getDoc,
    storeId,
  };
}
