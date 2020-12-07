export type Doc<StoreDoc> = {
  actions: any;
  id: string;
  listen: (
    handler: (docState: StoreDoc) => void
  ) => {
    docId: string;
    close: () => void;
  };
  get: () => undefined | StoreDoc;
};

export type Store<StoreKey, StoreDoc> = {
  storeId: string;
  getDoc: (key: StoreKey) => Doc<StoreDoc>;
};
