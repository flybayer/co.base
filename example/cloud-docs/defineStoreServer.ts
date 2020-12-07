import { Doc, Store } from "./core";

export type StoreServer<StoreKey, StoreDoc> = {
  getDoc: (key: StoreKey) => Doc<StoreDoc>;
};

export default function defineStoreServer<StoreKey, StoreDoc>(
  store: Store<StoreKey, StoreDoc>,
  { load }: { load: (key: StoreKey) => Promise<StoreDoc> }
): StoreServer<StoreKey, StoreDoc> {
  function getDoc(key: StoreKey) {
    return store.getDoc(key, () => load(key));
  }
  return {
    getDoc,
  };
}
