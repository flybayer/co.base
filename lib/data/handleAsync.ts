import Router from "next/router";

const DefaultErrorHandler = (e: Error) => {
  alert(e);
  console.error(e);
};

export function handleAsync<ResultValue>(
  promise: Promise<ResultValue>,
  onComplete: (v: ResultValue) => void = Router.reload,
  onError: (e: Error) => void = DefaultErrorHandler,
): Promise<void> {
  return promise.then(onComplete).catch(onError);
}
