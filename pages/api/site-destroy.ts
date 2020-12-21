import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type SiteDestroyPayload = {
  siteName: string;
};

function validatePayload(input: any): SiteDestroyPayload {
  return { siteName: input.siteName };
}

async function siteDestroy(user: APIUser, { siteName }: SiteDestroyPayload, res: NextApiResponse) {
  const site = await database.site.findUnique({
    where: { name: siteName },
    select: { owner: { select: { id: true } } },
  });
  const siteOwnerId = site?.owner.id;
  if (!siteOwnerId || siteOwnerId !== user.id) {
    throw new Error400({ name: "InsufficientPrivilege" });
  }
  await database.siteNode.deleteMany({
    where: { site: { name: siteName } },
  });
  await database.siteEvent.deleteMany({
    where: { site: { name: siteName } },
  });
  await database.siteRole.deleteMany({
    where: { site: { name: siteName } },
  });
  await database.siteRoleInvitation.deleteMany({
    where: { site: { name: siteName } },
  });
  await database.siteToken.deleteMany({
    where: { site: { name: siteName } },
  });
  await database.site.delete({
    where: { name: siteName },
  });
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ name: "NoAuth", message: "No Authenticated User" });
  }
  await siteDestroy(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
