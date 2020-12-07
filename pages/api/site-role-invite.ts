import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { looksLikeAnEmail } from "../../api-utils/looksLikeAnEmail";
import { sendEmail } from "../../api-utils/email";
import { getRandomLetters } from "../../api-utils/getRandomLetters";
import getSiteLink from "../../api-utils/getSiteLink";

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
  res: NextApiResponse,
) {
  if (looksLikeAnEmail(emailUsername)) {
    const email = emailUsername;
    const existingVerifiedEmail = await database.verifiedEmail.findOne({
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
    });

    let destLink = `/account/site-invites/${siteName}`;

    if (!existingVerifiedEmail) {
      // new user...
      const validationToken = getRandomLetters(32);
      // create an anonymous email validation, that is not yet associated to a user account because it remains unverified. at verification time we will associate it to a user account or create one.
      await database.emailValidation.create({
        data: {
          email: email,
          secret: validationToken,
        },
      });
      destLink = `/login/verify?token=${validationToken}&redirect=${encodeURIComponent(destLink)}`;
    }

    await sendEmail(
      email,
      `Invite to ${siteName}`,
      `
    hello and welcome, this is your invite email.

    ${getSiteLink(destLink)}
    `,
    );
    console.log({ invite });
  } else {
    const recipientUser = await database.user.findOne({
      where: { username: emailUsername },
    });
    if (!recipientUser) {
      throw new Error400({
        message: "Recipient not found",
        name: "RecipientNotFound",
      });
    }
  }
  console.log({ siteName, emailUsername, role });
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await siteRoleInvite(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
