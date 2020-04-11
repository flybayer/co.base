export default function defineCloudReducer(
  reducerName,
  reducerFn,
  initialState,
) {
  return {
    type: 'CloudReducer',
    reducerName,
    reducerFn,
    initialState,
  };
}
