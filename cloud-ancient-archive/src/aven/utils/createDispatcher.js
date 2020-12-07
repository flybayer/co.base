export default function createDispatcher(
  actions,
  fallbackDispatch,
  filterDomain,
  sourceId,
) {
  const shouldLog = !!sourceId && false;
  async function dispatch(action) {
    if (filterDomain && fallbackDispatch && action.domain !== filterDomain) {
      const result = await fallbackDispatch(action);
      shouldLog && console.log(`Dispatch via ${sourceId}: `, action, result);
      return result;
    }
    if (actions[action.type]) {
      const result = await actions[action.type](action);
      shouldLog && console.log(`Dispatch via ${sourceId}: `, action, result);
      return result;
    }
    if (fallbackDispatch) {
      const result = await fallbackDispatch(action);
      shouldLog && console.log(`Dispatch via ${sourceId}: `, action, result);
      return result;
    }
    throw new Error(`Cannot find action "${action.type}"`);
  }
  return dispatch;
}
