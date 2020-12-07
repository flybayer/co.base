import { Doc } from "./core";

export default function createDoc<StoreDoc>(
  docId: string,
  actions: any,
  initialValue: StoreDoc
): Doc<StoreDoc> {
  let value: StoreDoc = initialValue;
  const subscribers = new Set<(docState: StoreDoc) => void>();
  function listen(handler: (docState: StoreDoc) => void) {
    handler(value);
    subscribers.add(handler);
    function close() {
      subscribers.delete(handler);
    }
    return {
      docId,
      close,
    };
  }
  function setValue(v: StoreDoc): void {
    value = v;
    subscribers.forEach((handle) => handle(value));
  }
  function get(): StoreDoc {
    return value;
  }
  return {
    actions: Object.fromEntries(
      Object.entries(actions).map(([actionName, actionDef]) => {
        return [
          actionName,
          () => {
            // do action here...
          },
        ];
      })
    ),
    listen,
    id: docId,
    get,
  };
}
