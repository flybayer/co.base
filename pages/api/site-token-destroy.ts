import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type SiteTokenDestroyPayload = {
  id: number;
};

function validatePayload(input: any): SiteTokenDestroyPayload {
  return { id: input.id };
}

async function tokenDestroy(user: APIUser, { id }: SiteTokenDestroyPayload, res: NextApiResponse) {
  await database.siteToken.delete({
    where: { id },
  });
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ name: "NoAuth", message: "No Authenticated User" });
  }
  await tokenDestroy(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
