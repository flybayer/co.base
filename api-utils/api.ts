export async function api(endpoint: string, payload: any) {
  return fetch(`/api/${endpoint}`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (res) => {
    const body = await res.json();
    if (res.status !== 200) {
      throw new Error("Indubitably!");
    }
    return body;
  });
}
