import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error500 } from "../../lib/server/Errors";
import getVerifiedUser from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import { startSiteEvent } from "../../lib/data/SiteEvent";
import { RoleEditResponse } from "../../lib/data/EventTypes";

type SiteRole = "admin" | "manager" | "writer" | "reader";

export type SiteRoleEditPayload = {
  siteName: string;
  userId: number;
  roleType: SiteRole | "revoke";
};

function validatePayload(input: any): SiteRoleEditPayload {
  return { ...input };
}

async function siteRoleEdit(
  { siteName, userId, roleType }: SiteRoleEditPayload,
  res: NextApiResponse,
): Promise<RoleEditResponse> {
  const site = await database.site.findUnique({ where: { name: siteName }, select: { id: true } });
  if (!site) throw new Error500({ name: "SiteNotFound", data: { siteName } });

  if (roleType === "revoke") {
    await database.siteRole.delete({
      where: { SiteRoleUnique: { siteId: site.id, userId } },
    });
    return { userId, role: "none" };
  } else {
    await database.siteRole.update({
      where: { SiteRoleUnique: { siteId: site.id, userId } },
      data: { name: roleType },
    });
    return { userId, role: roleType };
  }
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  const action = validatePayload(req.body);
  const [resolve, reject] = await startSiteEvent("RoleEdit", { siteName: action.siteName, user: verifiedUser });
  try {
    const result = await siteRoleEdit(action, res);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
});

export default APIHandler;
