import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { sendEmail } from "../../lib/server/email";
import { sendSMS } from "../../lib/server/sms";
import { getRandomLetters } from "../../lib/server/getRandomLetters";
import { Error400, Error500 } from "../../lib/server/Errors";
import setCookie from "../../lib/server/setCookie";
import getSiteLink from "../../lib/server/getSiteLink";
import { getRandomNumbers } from "../../lib/server/getRandomNumbers";
import { createAPI } from "../../lib/server/createAPI";
import bcrypt from "bcrypt";
import { encode } from "../../lib/server/jwt";
import { looksLikeAnEmail } from "../../lib/server/looksLikeAnEmail";
import { btoa } from "../../lib/server/Base64";

type Email = string;

export type LoginRegisterPayload = {
  email?: Email;
  phone?: string;
  password?: string;
  redirect?: string;
  method?: "email" | "phone" | "password";
};

export type LoginRegisterResponse = {
  status: number;
  email?: string;
  phone?: string;
  jwt?: string;
};

function validatePayload(input: any): LoginRegisterPayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",
      name: "NoBody",
    });
  const { email, phone, redirect } = input;
  if (typeof email === "string") {
    // meh should validate email+
  } else if (typeof phone === "string") {
    if (!/\+[1-9]\d{1,14}$/.test(phone))
      throw new Error400({
        message: '"phone" string does not look right.',
        name: "BadPhone",
      });
  } else {
    throw new Error400({
      message: '"email" or "phone" string not provided in request body.',
      name: "BadEmail",
    });
  }

  return { email, phone, redirect, method: input.method, password: input.password };
}

const userSelectQuery = { passwordHash: true, email: true, id: true, username: true };

async function loginRegisterEmail(
  email: string,
  password: undefined | string,
  forceSend: boolean,
  res: NextApiResponse,
  redirect?: string,
  originIp?: string,
) {
  let existingUser = null;
  let emailToVerify = null;
  if (looksLikeAnEmail(email)) {
    console.log("EMAIL", email);
    emailToVerify = email;
    const verified = await database.verifiedEmail.findUnique({
      where: { email },
      include: {
        user: { select: userSelectQuery },
      },
    });
    existingUser = verified?.user;
    if (!existingUser) {
      // an edge case exists where a verified row does not exist but the user has the email set as a primary email. this makes sure that such a user may still log in:
      const userPrimaryLookup = await database.user.findUnique({
        where: { email },
        select: userSelectQuery,
      });
      if (userPrimaryLookup) {
        existingUser = userPrimaryLookup;
      }
    }
  } else {
    existingUser = await database.user.findUnique({
      where: { username: email },
      select: userSelectQuery,
    });
    emailToVerify = existingUser?.email;
  }
  const hashedSavedPassword = existingUser?.passwordHash;
  if (existingUser && hashedSavedPassword && !!password && !forceSend) {
    const doesMatch = await new Promise((resolve, reject) => {
      bcrypt.compare(password, hashedSavedPassword, (err, doesMatch) => {
        if (err) reject(err);
        else resolve(doesMatch);
      });
    });
    if (!doesMatch) {
      throw new Error("Invalid password");
    }
    const revalidateToken = getRandomLetters(47);
    await database.deviceToken.create({
      data: {
        token: revalidateToken,
        user: { connect: { id: existingUser.id } },
        approveTime: new Date(),
        requestTime: new Date(),
        originIp,
        name: "Web Session",
        type: "web:password",
      },
    });
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 24; // 1 day.. for now
    const jwt = encode({
      sub: existingUser.id,
      exp,
      iat,
      revalidateToken,
      revalidateIP: originIp,
      username: existingUser.username,
    });
    setCookie(res, "AvenSession", jwt);
    return { status: 3, jwt, email };
  }
  if (!forceSend && existingUser && existingUser.passwordHash) {
    return { status: 1, email };
  }
  if (emailToVerify) {
    const validationToken = getRandomLetters(47);
    // create an anonymous email validation, that is not yet associated to a user account because it remains unverified. at verification time we will associate it to a user account or create one.
    await database.emailValidation.create({
      data: {
        email: emailToVerify,
        secret: validationToken,
      },
    });
    const redirectPath = `/login/verify?token=${validationToken}&email=${btoa(emailToVerify)}`;
    const loginButtonURL = getSiteLink(
      redirect ? `${redirectPath}&redirect=${encodeURIComponent(redirect)}` : redirectPath,
    );
    await sendEmail(
      emailToVerify,
      existingUser ? "Welcome back to Aven" : "Welcome to Aven",
      `Click here to log in:
    
    ${loginButtonURL}
    `,
    );
    return { status: 2, email };
  }
  throw new Error400({
    name: "InvalidLoginName",
    message: "Invalid email or username",
  });
}

async function loginRegisterPhone(phone: string, res: NextApiResponse) {
  const existingUser = await database.user.findUnique({
    where: { phone },
  });
  if (existingUser && existingUser.passwordHash) {
    return { status: 1, phone };
  } else {
    const secret = getRandomNumbers(6);
    await database.phoneValidation.create({
      data: {
        phone,
        secret,
      },
    });
    await sendSMS(phone, `Your verification code is ${secret}`);
    return { status: 2, phone };
  }
}

async function loginRegister(
  { email, phone, password, method, redirect }: LoginRegisterPayload,
  res: NextApiResponse,
  originIp?: string,
): Promise<LoginRegisterResponse> {
  if (email) {
    return loginRegisterEmail(email, password, method === "email", res, redirect, originIp);
  } else if (phone) {
    throw new Error500({ name: "Unimplemented", message: "The phone workflow has been temporarily disabled" });
    // return loginRegisterPhone(phone, res);
  } else throw new Error("Insufficient login details");
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const action = validatePayload(req.body);
  const originIp = req.headers["x-forwarded-for"] && String(req.headers["x-forwarded-for"]);
  return await loginRegister(action, res, originIp);
});

export default APIHandler;
