import { Doc, Store } from "./core";
import createDoc from "./createDoc";

const stringify = require("json-stable-stringify");

export default function defineStore<StoreKey, StoreDoc>(
  storeId: string,
  { actions }: { actions: any },
  getInitialValue: (key: StoreKey) => StoreDoc
): Store<StoreKey, StoreDoc> {
  const docs: NodeJS.Dict<Doc<StoreDoc>> = {};

  function getDoc(key: StoreKey): Doc<StoreDoc> {
    const docId: string = stringify(key);
    const doc = docs[docId];
    if (doc) return doc;
    const initialValue = getInitialValue(key);
    const newDoc = createDoc<StoreDoc>(docId, actions, initialValue);
    docs[docId] = newDoc;
    return newDoc;
  }

  // function getLoadableDoc(
  //   key: StoreKey,
  //   loader: () => Promise<StoreDoc | null>
  // ): Doc<StoreDoc> {
  //   const docId: string = stringify(key);
  //   const doc = docs[docId];
  //   if (doc) return doc;
  //   const initialValue = getInitialValue(key);
  //   const newDoc = createDoc<StoreDoc>(docId, actions, initialValue);
  //   docs[docId] = newDoc;
  //   return newDoc;
  // }

  return {
    getDoc,
    storeId,
  };
}
