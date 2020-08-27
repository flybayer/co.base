import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { sendEmail } from "../../api-utils/email";
import { getRandomLetters } from "../../api-utils/getRandomLetters";
import { Error400 } from "../../api-utils/Errors";
import { apiRespond } from "../../api-utils/apiRespond";
import setCookie from "../../api-utils/setCookie";
import getSiteLink from "../../api-utils/getSiteLink";

type Email = string;

export type LoginRegisterPayload = {
  email: Email;
};

function validatePayload(input: any): LoginRegisterPayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",
      field: "email",
    });
  const { email } = input;
  if (typeof email !== "string")
    throw new Error400({
      message: '"email" string not provided in request body.',
      field: "email",
    });
  if (!/\S+@\S+\.\S+/.test(email))
    throw new Error400({
      message: '"email" string does not look right.',
      field: "email",
    });
  return { email };
}

async function loginRegister(
  { email }: LoginRegisterPayload,
  res: NextApiResponse
) {
  const existingUser = await database.user.findOne({
    where: { email },
  });
  if (existingUser && existingUser.passwordHash && existingUser.passwordSalt) {
    return { status: 1, email };
  } else {
    const validationToken = getRandomLetters(32);
    const token = getRandomLetters(32);
    const logoutToken = getRandomLetters(32);
    await database.emailValidation.create({
      data: {
        email,
        secret: validationToken,
      },
    });
    await sendEmail(
      email,
      existingUser ? "Welcome back to Aven" : "Welcome to Aven",
      `Click here to log in:

${getSiteLink(`/api/email-auth?token=${validationToken}`)}
`
    );
    setCookie(res, "AvenSessionToken", token);
    setCookie(res, "AvenSessionLogoutToken", logoutToken);
    return { sessionToken: token, linkSentEmail: email };
  }
}

async function handleActionPayload(payload: any, res: NextApiResponse) {
  return await loginRegister(validatePayload(payload), res);
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  apiRespond(res, handleActionPayload(req.body, res));
};
