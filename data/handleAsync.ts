import Router from "next/router";

export function handleAsync<ResultValue>(
  promise: Promise<ResultValue>,
  onComplete: (v: ResultValue) => void = Router.reload,
): void {
  promise.then(onComplete).catch((e) => {
    alert(e);
    console.error(e);
  });
}
