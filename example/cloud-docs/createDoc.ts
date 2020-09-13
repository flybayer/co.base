import { Doc } from "./core";

export default function createDoc<StoreDoc>(actions: any): Doc<StoreDoc> {
  function listen(handler: (docState: StoreDoc) => void) {
    return () => {};
  }
  return { actions: {}, listen };
}
