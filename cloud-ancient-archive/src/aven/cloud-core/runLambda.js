export default function runLambda(
  pureDataFn,
  argumentValue,
  argumentId,
  argumentDoc,
  cloudClient,
) {
  const dependencies = new Set();
  async function loadDependencies() {
    const depResults = await Promise.all(
      [...dependencies].map(async dep => {
        return await dep.loadValue();
      }),
    );
    return depResults;
  }
  function getValue(cloudValue) {
    dependencies.add(cloudValue);
    return cloudValue.getValue();
  }
  function computeResult() {
    let result = null;
    try {
      result = pureDataFn(
        { value: argumentValue, id: argumentId },
        argumentDoc,
        cloudClient,
        getValue,
      );
    } catch (e) {
      console.error('Error argument: ', argumentValue);
      throw new Error(`Error running function: ` + e.message);
    }
    return result;
  }
  return {
    getIsConnected: () => ![...dependencies].find(dep => !dep.getIsConnected()),
    dependencies,
    loadDependencies,
    result: computeResult(),
    reComputeResult: computeResult,
  };
}
