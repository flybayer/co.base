import { Doc } from "../cloud-docs/core";
import defineStore from "../cloud-docs/defineStore";
import useStoreDoc from "../cloud-docs/useStoreDoc";

export type ClapsKey = void;

export type ClapsDoc = {
  count: number;
};

export type ClapOnceAction = {};

function clapOnce(_: ClapOnceAction, state: ClapsDoc) {
  return {
    count: state.count + 1,
  };
}

const Claps = defineStore<ClapsKey, ClapsDoc>("Claps", {
  actions: {
    clapOnce,
  },
});

export function useClaps(): Doc<ClapsDoc> {
  return useStoreDoc<ClapsKey, ClapsDoc>(Claps, undefined);
}

export default Claps;
