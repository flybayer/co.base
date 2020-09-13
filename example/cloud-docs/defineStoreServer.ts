import { Store } from "./core";

export default function defineStoreServer<StoreKey, StoreDoc>(
  store: Store<StoreKey, StoreDoc>,
  { load }: { load: (key: StoreKey) => Promise<StoreDoc> }
) {}
