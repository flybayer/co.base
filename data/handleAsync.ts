import Router from "next/router";

export function handleAsync<ResultValue>(
  promise: Promise<ResultValue>,
  onComplete: (v: ResultValue) => void = Router.reload,
): Promise<void> {
  return promise.then(onComplete).catch((e) => {
    alert(e);
    console.error(e);
  });
}
