import { NextApiRequest, NextApiResponse } from "next";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import { database } from "../../lib/data/database";

export type SiteRoleRespondPayload = {
  siteName: string;
  accept: boolean;
};

function validatePayload(input: any): SiteRoleRespondPayload {
  return { ...input };
}

async function siteRoleRespond(user: APIUser, { siteName, accept }: SiteRoleRespondPayload, res: NextApiResponse) {
  const invite = await database.siteRoleInvitation.findFirst({
    where: {
      site: { name: siteName },
      OR: [{ recipientUserId: user.id }, { toEmail: user.email }],
    },
    select: {
      inviteTime: true,
      name: true,
      id: true,
      toEmail: true,
      fromUser: { select: { email: true, username: true } },
    },
  });
  if (!invite) {
    throw new Error400({
      name: "SiteRoleInviteNotFound",
      data: { email: user.email, recipientUserId: user.id, siteName },
    });
  }
  if (accept) {
    await database.siteRole.create({
      data: {
        name: invite.name,
        site: { connect: { name: siteName } },
        user: { connect: { id: user.id } },
      },
    });
  }
  await database.siteRoleInvitation.delete({
    where: { id: invite.id },
  });

  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await siteRoleRespond(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
