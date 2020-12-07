import defineCloudFunction from './defineCloudFunction';

function expandN(cloudValue, n) {
  if (n <= 0) {
    return cloudValue;
  }
  return cloudValue.expand((value, d) => {
    if (value && value.on) {
      return {
        past: expandN(d.getBlock(value.on), n - 1),
        value: value.value,
        meta: { id: value.id, time: value.time },
      };
    }
    return value;
  });
}
const Last20 = defineCloudFunction(
  'Last20',
  (docState, doc, cloud, getValue) => {
    const expandedResult = getValue(expandN(doc, 20));
    if (expandedResult) {
      let results = [];
      let walk = expandedResult;
      while (walk.past) {
        walk.value &&
          results.push({
            ...walk.meta,
            value: walk.value,
          });
        walk = walk.past;
      }
      return results;
    }
    return expandedResult;
  },
  'a',
);

const builtInFunctions = {
  Last20,
};

export default builtInFunctions;
