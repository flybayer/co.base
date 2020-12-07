import { NextApiRequest, NextApiResponse } from "next";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type SiteRoleAcceptPayload = {
  siteName: string;
};

function validatePayload(input: any): SiteRoleAcceptPayload {
  return { ...input };
}

async function siteRoleAccept(user: APIUser, { siteName }: SiteRoleAcceptPayload, res: NextApiResponse) {
  console.log("Coming soon siteRoleAccept", { siteName, user });
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await siteRoleAccept(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
