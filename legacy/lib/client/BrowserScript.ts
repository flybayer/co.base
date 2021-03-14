export async function browserScriptLoad(scriptUrl: string): Promise<any> {
  const script = document.createElement("script");
  script.src = scriptUrl;
  document.body.appendChild(script);

  return await new Promise<void>((resolve, reject) => {
    script.onload = function () {
      resolve();
    };
    script.onerror = function () {
      reject();
    };
  });
}
