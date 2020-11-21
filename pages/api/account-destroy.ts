import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type DestroyAccountPayload = {};

function validatePayload(input: any): DestroyAccountPayload {
  return {};
}

async function destroyAccount(
  user: APIUser,
  {}: DestroyAccountPayload,
  res: NextApiResponse
) {
  throw new Error("not impl");
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
    }
    await destroyAccount(verifiedUser, validatePayload(req.body), res);
    return {};
  }
);

export default APIHandler;
