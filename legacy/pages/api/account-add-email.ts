import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import { getRandomLetters } from "../../lib/server/getRandomLetters";
import { sendEmail } from "../../lib/server/email";
import { btoa } from "../../lib/server/Base64";
import getSiteLink from "../../lib/server/getSiteLink";

export type AddEmailPayload = {
  email: string;
};

function validatePayload(input: any): AddEmailPayload {
  return { email: String(input.email) };
}

async function addEmail(user: APIUser, { email }: AddEmailPayload, res: NextApiResponse) {
  const validationToken = getRandomLetters(32);
  const verifiedAlreadyEmail = await database.verifiedEmail.findFirst({
    where: { email },
    select: { user: { select: { id: true } } },
  });
  if (verifiedAlreadyEmail) {
    const thisAccount = user.id === verifiedAlreadyEmail.user.id;
    throw new Error400({
      name: "EmailAlreadyUsed",
      message: thisAccount
        ? `"${email}" is already on your account.`
        : `"${email}" has already been claimed by another account.`,
      data: {
        email,
        thisAccount,
      },
    });
  }

  await database.emailValidation.create({
    data: {
      secret: validationToken,
      email,
      emailTime: new Date(),
      user: { connect: { id: user.id } },
    },
  });
  await sendEmail(
    email,
    "Verify New Email Address",
    `Click here to verify your email:
  
  ${getSiteLink(`/account/verify?token=${validationToken}&email=${btoa(email)}`)}
  `,
  );
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await addEmail(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
