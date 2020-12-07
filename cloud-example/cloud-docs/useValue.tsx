import { useEffect, useState } from "react";
import { Doc } from "./core";

export default function useValue<StoreDoc>(
  doc: Doc<StoreDoc>,
  mapper?: (state: StoreDoc) => any // todo, implement mapping abilities..
): null | undefined | StoreDoc {
  const [val, setVal] = useState<StoreDoc | null | undefined>(undefined);
  useEffect(() => {
    if (!doc || !doc.listen) setVal(null);
    const { close } = doc.listen((v) => {
      setVal(v);
    });
    return close;
  }, [doc]);
  return val;
}
