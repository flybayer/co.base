import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type SiteDestroyPayload = {
  name: string;
};

function validatePayload(input: any): SiteDestroyPayload {
  return { name: input.name };
}

async function siteDestroy(
  user: APIUser,
  { name }: SiteDestroyPayload,
  res: NextApiResponse
) {
  await database.site.delete({
    where: { name },
  });
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ name: "NoAuth", message: "No Authenticated User" });
    }
    await siteDestroy(verifiedUser, validatePayload(req.body), res);
    return {};
  }
);

export default APIHandler;
