import { Error400, Error403, Error404, Error500 } from "./Errors";

export async function api<Result>(endpoint: string, payload: any): Promise<Result> {
  return fetch(`/api/${endpoint}`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (res) => {
    const body = await res.json();

    if (res.status === 400) throw new Error400(body.error);
    if (res.status === 403) throw new Error403(body.error);
    if (res.status === 404) throw new Error404(body.error);
    if (res.status !== 200) throw new Error500(body.error);

    return body;
  });
}
