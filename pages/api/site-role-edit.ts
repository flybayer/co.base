import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400, Error500 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { looksLikeAnEmail } from "../../api-utils/looksLikeAnEmail";
import { sendEmail } from "../../api-utils/email";
import { getRandomLetters } from "../../api-utils/getRandomLetters";
import getSiteLink from "../../api-utils/getSiteLink";
import { btoa } from "../../api-utils/Base64";

type SiteRole = "admin" | "manager" | "writer" | "reader";

export type SiteRoleEditPayload = {
  siteName: string;
  userId: number;
  roleType: SiteRole | "revoke";
};

function validatePayload(input: any): SiteRoleEditPayload {
  return { ...input };
}

async function siteRoleEdit(user: APIUser, { siteName, userId, roleType }: SiteRoleEditPayload, res: NextApiResponse) {
  const site = await database.site.findUnique({ where: { name: siteName }, select: { id: true } });
  if (!site) throw new Error500({ name: "SiteNotFound", data: { siteName } });

  if (roleType === "revoke") {
    await database.siteRole.delete({
      where: { SiteRoleUnique: { siteId: site.id, userId } },
    });
  } else {
    await database.siteRole.update({
      where: { SiteRoleUnique: { siteId: site.id, userId } },
      data: { name: roleType },
    });
  }
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await siteRoleEdit(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
