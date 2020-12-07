export type Subscription = {
  key: string;
  close: () => void;
};

export type Store<Data> = {
  get: () => Data;
  listen: (handler: (v: Data) => void) => Subscription;
};

export type MutableStore<Data, Action> = Store<Data> & {
  transact: (mutator: (d: Data) => void, action?: Action) => void;
};
