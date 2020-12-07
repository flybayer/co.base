import { Doc, Store } from "./core";

export default function useStoreDoc<StoreKey, StoreDoc>(
  store: Store<StoreKey, StoreDoc>,
  key: StoreKey
): Doc<StoreDoc> {
  return;
}
