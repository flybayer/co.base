import sourceFromRootDocSet from './sourceFromRootDocSet';
import createReducerStream from './createReducerStream';
import createDocSet from './createDocSet';
import { error, trace } from '@aven/logger';

export default function createCloud({
  domain,
  source,
  auth,
  onReport,
  onInitialLoad,
}) {
  const docs = createDocSet({
    domain,
    source,
    auth,
    onGetName: () => null,
    nameChangeNotifiers: null,
    onReport: (reportType, report) => {
      onReport && onReport(reportType, { ...report, domain });
    },
    onInitialLoad,
  });

  function setReducer(
    resultStateDocName,
    { reducer, actionsDoc, snapshotInterval, snapshotsDoc },
  ) {
    const stream = createReducerStream(
      actionsDoc,
      reducer.reducerFn,
      reducer.initialState,
      reducer.reducerName,
      {
        snapshotsDoc,
      },
    )
      .filter(streamState => {
        return !!streamState && !streamState.unloadedProgress;
      })
      .spy(update => {
        (async () => {
          if (update.next && snapshotsDoc) {
            const lastSnapshot = await snapshotsDoc.value.load();
            if (
              lastSnapshot === null ||
              lastSnapshot === undefined ||
              lastSnapshot.context === undefined ||
              lastSnapshot.context === null ||
              (update.next.context &&
                lastSnapshot.context.reducerName !==
                  update.next.context.reducerName) ||
              (update.next.context &&
                lastSnapshot.context.gen <=
                  update.next.gen - snapshotInterval) ||
              (update.next.context &&
                lastSnapshot.context.rootDocId !==
                  update.next.context.rootDocId)
            ) {
              const { context, id, value } = update.next;
              await snapshotsDoc.putValue({ context, id, value });
              return { id, value, context };
            }
          }
          return false;
        })()
          .then(hasWritten => {
            hasWritten &&
              trace('SnapshotStored', {
                ...hasWritten.context,
              });
          })
          .catch(e => {
            error('SnapshotWriteError', {
              error: e,
              name: snapshotsDoc.getName(),
            });
          });
      });
    docs.setOverrideStream(resultStateDocName, stream);
    return docs.get(resultStateDocName);
  }

  function hydrateDoc(hydrateDomain, name, id, value) {
    if (hydrateDomain !== domain) {
      return;
    }
    const doc = docs.get(name);
    doc.hydrate(id, value);
  }

  function hydrateValue({ type, domain, name, id, value }) {
    if (type === 'Doc') {
      hydrateDoc(domain, name, id, value);
    } else if (type === 'Block') {
      throw new Error('Block hydrating yet implemented');
    }
  }
  const cloudSessionClient = {
    type: 'SesionClient',
    docs,
    auth,
    domain,
    connected: source.connected,
    get: docs.get,
    hydrate: values => {
      values.forEach(hydrateValue);
    },
    hydrateValue,
    setReducer,
    ...sourceFromRootDocSet(docs, domain, source, auth),
  };
  return cloudSessionClient;
}
