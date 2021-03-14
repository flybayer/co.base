import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400, Error403 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";

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
    throw new Error403({ name: "InsufficientPrivilege" });
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
  const verifiedUser = await getVerifiedUser(req, res);
  if (!verifiedUser) {
    throw new Error400({ name: "NoAuth", message: "No Authenticated User" });
  }
  await siteDestroy(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
