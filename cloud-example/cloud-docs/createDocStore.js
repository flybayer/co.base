import { produce } from "immer";
import stringify from "json-stable-stringify";

function createDocStore({ get, actions }) {
  const docs = new Map();
  function createDoc(key, docId) {
    const subscribers = new Set();
    const docState = {
      state: undefined,
      isLoaded: false,
      loadError: null,
    };
    let initialGetPromise = null;

    function notify() {
      subscribers.forEach((handler) => handler(docState));
    }
    async function load() {
      if (docState.isLoaded) return;
      if (initialGetPromise) return await initialGetPromise;
      initialGetPromise = get(key);
      initialGetPromise
        .then((state) => {
          docState.isLoaded = true;
          docState.state = state;
          notify();
        })
        .catch((e) => {
          console.error(e);
          docState.loadError = e;
          notify();
        })
        .finally(() => {
          initialGetPromise = null;
        });
      return await initialGetPromise;
    }
    return {
      id: docId,
      actions: Object.fromEntries(
        Object.entries(actions).map(([actionName, actionDef]) => {
          async function action(payload) {
            // todo: handle actionDef.mutate
            await load();
            const newState = produce(docState.state, (draftState) =>
              actionDef.mutateLocal(payload, draftState)
            );
            docState.state = newState;
            notify();
          }
          return [actionName, action];
        })
      ),
      listen: (handler) => {
        // set up subscription and closer:
        subscribers.add(handler);
        handler(docState);
        function close() {
          subscribers.delete(handler);
          // todo, clean up doc from store if no more subscribers remain
        }

        // load initial doc data if needed
        load();

        return { docId, close };
      },
    };
  }
  function getDoc(key) {
    const docId = stringify(key);
    if (docs.has(docId)) {
      return docs.get(docId);
    }
    const doc = createDoc(key, docId);
    docs.set(docId, doc);
    return doc;
  }
  return {
    getDoc,
    actions: Object.keys(actions),
  };
}

module.exports = createDocStore;
