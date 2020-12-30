import { NextApiRequest, NextApiResponse } from "next";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";

export type DestroyAccountPayload = { [a: string]: never };

function validatePayload(input: any): DestroyAccountPayload {
  return {};
}

async function destroyAccount(user: APIUser, {}: DestroyAccountPayload, res: NextApiResponse) {
  throw new Error("not impl");
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await destroyAccount(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
