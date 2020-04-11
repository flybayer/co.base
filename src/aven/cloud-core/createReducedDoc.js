import createStreamDoc from './createStreamDoc';
import createReducerStream from './createReducerStream';

export default function createReducedDoc({
  actions,
  reducer,
  domain,
  onGetName,
  onCreateChild,
}) {
  const reducerStream = createReducerStream(
    actions,
    reducer.reducerFn,
    reducer.initialState,
    reducer.reducerName,
    {},
  );
  const streamDoc = createStreamDoc(
    reducerStream,
    domain,
    onGetName,
    onCreateChild,
  );
  return streamDoc;
}
