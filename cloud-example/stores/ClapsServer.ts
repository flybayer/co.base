import defineStoreServer from "../cloud-docs/defineStoreServer";
import Claps, { ClapsKey, ClapsDoc } from "./Claps";

const ClapsStoreServer = defineStoreServer(Claps, {
  load: async (_: ClapsKey): Promise<ClapsDoc> => {
    return { count: 0 };
  },
});

export default ClapsStoreServer;
