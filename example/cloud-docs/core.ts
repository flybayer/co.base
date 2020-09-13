export type Doc<StoreDoc> = {
  actions: any;
  listen: (handler: (docState: StoreDoc) => void) => () => void;
};

export type Store<StoreKey, StoreDoc> = {
  docId: string;
  getDoc: (key: StoreKey) => Doc<StoreDoc>;
  // subscribe: (handler: (v: StoreDoc) => void) => () => void,
};
