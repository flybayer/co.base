import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

type SiteRole = "admin" | "manager" | "writer" | "reader";

export type SiteRoleInvitePayload = {
  emailUsername: string;
  siteName: string;
  role: SiteRole;
};

function validatePayload(input: any): SiteRoleInvitePayload {
  return { ...input };
}

async function siteRoleInvite(
  user: APIUser,
  { siteName, emailUsername, role }: SiteRoleInvitePayload,
  res: NextApiResponse
) {
  console.log({ siteName, emailUsername, role });
  return {};
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
    }
    await siteRoleInvite(verifiedUser, validatePayload(req.body), res);
    return {};
  }
);

export default APIHandler;
