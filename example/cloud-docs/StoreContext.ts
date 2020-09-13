import { createContext } from "react";

type StoreClient = {
  dispatch: (value: { storeId: string; key: any; action: any }) => Promise<any>;
  subscribe: (
    storeId: string,
    key: any,
    handler: (v: any) => void
  ) => () => void;
};

const StoreContext = createContext<StoreClient | null>(null);

export default StoreContext;
