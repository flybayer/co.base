import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { looksLikeAnEmail } from "../../api-utils/looksLikeAnEmail";
import { sendEmail } from "../../api-utils/email";
import { getRandomLetters } from "../../api-utils/getRandomLetters";
import getSiteLink from "../../api-utils/getSiteLink";
import { btoa } from "../../api-utils/Base64";
import { SiteRole } from "../../data/SiteRoles";
import { RoleInviteResponse, startSiteEvent } from "../../data/SiteEvent";

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
  res: NextApiResponse,
): Promise<RoleInviteResponse> {
  if (looksLikeAnEmail(emailUsername)) {
    const email = emailUsername;
    const existingVerifiedEmail = await database.verifiedEmail.findUnique({
      where: { email: email },
      select: { user: { select: { id: true } } },
    });

    const invite = await database.siteRoleInvitation.create({
      data: {
        site: { connect: { name: siteName } },
        fromUser: { connect: { id: user.id } },
        toEmail: email,
        recipientUser: existingVerifiedEmail ? { connect: { id: existingVerifiedEmail.user.id } } : undefined,
        name: role,
      },
      select: { id: true },
    });

    let destLink = `/account/site-invite/${siteName}`;

    let createdEmailValidationId;
    if (!existingVerifiedEmail) {
      // new user...
      const validationToken = getRandomLetters(32);
      // create an anonymous email validation, that is not yet associated to a user account because it remains unverified. at verification time we will associate it to a user account or create one.
      const emailValidation = await database.emailValidation.create({
        data: {
          email: email,
          secret: validationToken,
        },
        select: { id: true },
      });
      createdEmailValidationId = emailValidation.id;
      destLink = `/login/verify?token=${validationToken}&redirect=${encodeURIComponent(destLink)}&email=${btoa(email)}`;
    }

    await sendEmail(
      email,
      `Invite to ${siteName}`,
      `
    hello and welcome, this is your invite email.

    ${getSiteLink(destLink)}
    `,
    );
    return {
      role,
      toEmail: email,
      toUserId: null,
      inviteId: invite.id,
      createdEmailValidationId: createdEmailValidationId || null,
    };
  } else {
    const recipientUser = await database.user.findUnique({
      where: { username: emailUsername },
      select: { id: true, email: true },
    });

    if (!recipientUser) {
      throw new Error400({
        message: "Recipient not found",
        name: "RecipientNotFound",
      });
    }
    const invite = await database.siteRoleInvitation.create({
      data: {
        site: { connect: { name: siteName } },
        fromUser: { connect: { id: user.id } },
        toEmail: null,
        recipientUser: { connect: { id: recipientUser.id } },
        name: role,
      },
      select: { id: true },
    });
    const destLink = `/account/site-invite/${siteName}`;
    if (recipientUser.email) {
      await sendEmail(
        recipientUser.email,
        `Invite to ${siteName}`,
        `
    hello and welcome, this is your invite email.

    ${getSiteLink(destLink)}
    `,
      );
    }
    return { role, toEmail: null, toUserId: recipientUser.id, inviteId: invite.id, createdEmailValidationId: null };
  }
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  const action = validatePayload(req.body);
  if (!verifiedUser) throw new Error400({ name: "UserNotAuthenticated" });
  const [resolve, reject] = await startSiteEvent("RoleInvite", { siteName: action.siteName, user: verifiedUser });
  try {
    const result = await siteRoleInvite(verifiedUser, action, res);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
});

export default APIHandler;
