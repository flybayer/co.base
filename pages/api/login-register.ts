import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { sendEmail } from "../../api-utils/email";
import { sendSMS } from "../../api-utils/sms";
import { getRandomLetters } from "../../api-utils/getRandomLetters";
import { Error400, Error500 } from "../../api-utils/Errors";
import setCookie from "../../api-utils/setCookie";
import getSiteLink from "../../api-utils/getSiteLink";
import { getRandomNumbers } from "../../api-utils/getRandomNumbers";
import { createAPI } from "../../api-utils/createAPI";
import bcrypt from "bcrypt";
import { encode } from "../../api-utils/jwt";

type Email = string;

export type LoginRegisterPayload = {
  email?: Email;
  phone?: string;
  password?: string;
  method?: "email" | "phone" | "password";
};

function validatePayload(input: any): LoginRegisterPayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",
      field: "email",
    });
  const { email, phone } = input;
  if (typeof email === "string") {
    if (!/\S+@\S+\.\S+/.test(email))
      throw new Error400({
        message: '"email" string does not look right.',
        field: "email",
      });
  } else if (typeof phone === "string") {
    if (!/\+[1-9]\d{1,14}$/.test(phone))
      throw new Error400({
        message: '"phone" string does not look right.',
        field: "phone",
      });
  } else {
    throw new Error400({
      message: '"email" or "phone" string not provided in request body.',
    });
  }

  return { email, phone, method: input.method, password: input.password };
}

async function loginRegisterEmail(
  email: string,
  password: undefined | string,
  forceSend: boolean,
  res: NextApiResponse
) {
  const existingUser = await database.user.findOne({
    where: { email },
    select: { passwordHash: true, email: true, id: true },
  });
  if (!!password && !forceSend) {
    const doesMatch = await new Promise((resolve, reject) => {
      bcrypt.compare(password, existingUser.passwordHash, (err, doesMatch) => {
        if (err) reject(err);
        else resolve(doesMatch);
      });
    });
    if (!doesMatch) {
      throw new Error("Invalid password");
    }
    const jwt = encode({ sub: existingUser.id });
    setCookie(res, "AvenSession", jwt);
    return { jwt, email };
  }
  if (!forceSend && existingUser && existingUser.passwordHash) {
    return { status: 1, email };
  }
  const validationToken = getRandomLetters(32);
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
  
  ${getSiteLink(`/login/verify?token=${validationToken}`)}
  `
  );
  return { status: 2, email };
}

async function loginRegisterPhone(phone: string, res: NextApiResponse) {
  const existingUser = await database.user.findOne({
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
  { email, phone, password, method }: LoginRegisterPayload,
  res: NextApiResponse
) {
  if (email) {
    return loginRegisterEmail(email, password, method === "email", res);
  } else if (phone) {
    return loginRegisterPhone(phone, res);
  } else throw new Error("Insufficient login details");
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const action = validatePayload(req.body);
    return await loginRegister(action, res);
  }
);

export default APIHandler;
