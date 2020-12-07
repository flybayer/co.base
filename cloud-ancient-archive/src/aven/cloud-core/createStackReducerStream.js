import { getIdOfValue } from '@aven/utils';
import { streamOf, streamNever, combineStreams } from '@aven/stream';

// This is an older (and still functional) implementation of createReducerStream.

// we re-architected because the call stack would overflow in this implementation, thanks to the recursion through each reducer. The new implementation of createReducerStream properly caches the reduced values and allows the call stack to remain relatively short

export default function createStackReducerStream(
  actionsDoc,
  reducerFn,
  initialState,
  reducerName,
  { snapshotsDoc } = { snapshotsDoc: null },
) {
  const docStateStreams = new Map();
  function getDocStateStream(id, depth = 0) {
    if (id === undefined) {
      return streamNever('UndefinedId');
    }
    if (id === null) {
      const [stream] = streamOf(
        { value: null, id: null },
        'NoActionStateStream',
      );
      return stream;
    }
    if (docStateStreams.has(id)) {
      return docStateStreams.get(id);
    }
    const actionBlock = actionsDoc.getBlock(id);

    const docStateStream = actionBlock.idAndValue
      .map(actionDocState => {
        const actionDocId = actionDocState.id;
        const actionDocValue = actionDocState.value;
        const actionValue = actionDocValue.value || actionDocValue;

        let [prevStateStream] = streamOf({
          value: initialState,
          id: getIdOfValue(initialState).id,
        });
        if (actionDocValue.on && actionDocValue.on.type === 'BlockReference') {
          prevStateStream = getDocStateStream(actionDocValue.on.id, depth + 1);
        }
        return prevStateStream.map(lastState => {
          const newState = reducerFn(lastState.value, actionValue);
          const newId = getIdOfValue(newState).id;
          return {
            value: newState,
            id: newId,
            context: {
              type: 'ReducedStream',
              reducerName,
              docName: actionsDoc.getName(),
              docId: actionDocId,
              rootDocId: lastState.context
                ? lastState.context.rootDocId
                : actionDocId,
              gen: (lastState.context ? lastState.context.gen : 0) + 1,
            },
          };
        });
      })
      .flatten()
      .cacheFirst();

    docStateStreams.set(id, docStateStream);
    return docStateStream;
  }
  if (!snapshotsDoc) {
    return actionsDoc
      .dropRepeats((a, b) => {
        return a.id === b.id;
      }, 'DropRepeatedIdActions')
      .map(docState => {
        return getDocStateStream(docState.id);
      })
      .flatten()
      .dropRepeats((a, b) => {
        return a.id === b.id;
      }, 'DropRepeatedIdValues');
  }
  return combineStreams({
    sourceDoc: actionsDoc,
    snapshotValue: snapshotsDoc.value,
  })
    .map(({ snapshotValue, sourceDoc }) => {
      if (
        snapshotValue &&
        snapshotValue.context &&
        snapshotValue.context.reducerName === reducerName
      ) {
        const { docId } = snapshotValue.context;
        if (!docStateStreams.has(docId)) {
          const [docStateStream] = streamOf(snapshotValue);
          docStateStreams.set(docId, docStateStream);
        }
      }
      return getDocStateStream(sourceDoc.id);
    })
    .flatten()
    .dropRepeats((a, b) => {
      return a.id === b.id;
    }, 'DropRepeatedIdValues');
}
