import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import setCookie from "../../api-utils/setCookie";
import { encode } from "../../api-utils/jwt";
import { findTempUsername } from "../../api-utils/findTempUsername";
import { createAPI } from "../../api-utils/createAPI";

export type VerifyPhonePayload = {
  secret?: string;
  phone?: string;
};

function validatePayload(input: any): VerifyPhonePayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",

      name: "NoBody",
    });
  const { secret, phone } = input;
  if (typeof secret === "string") {
  } else if (typeof phone === "string") {
    if (!/\+[1-9]\d{1,14}$/.test(phone))
      throw new Error400({
        message: '"phone" string does not look right.',
        name: "InvalidPhone",
      });
  } else {
    throw new Error400({
      message: '"phone" or "secret" string not provided in request body.',
      name: "SecretOrPhoneNotProvided",
    });
  }

  return { secret, phone };
}

async function verifyPhone({ secret, phone }: VerifyPhonePayload, res: NextApiResponse) {
  const validations = await database.phoneValidation.findMany({
    where: {
      secret,
      phone,
    },
  });
  if (!validations.length) {
    throw new Error400({ name: "InvalidToken", message: "Invalid Token" });
  }
  await database.phoneValidation.deleteMany({
    where: {
      phone,
    },
  });
  const acceptedValidation = validations.find((validation) => {
    if (!secret || validation.secret !== secret) return false;
    if (!phone || validation.phone !== phone) return false;
    if (Date.now() - 60 * 60 * 1000 > validation.sendTime.getTime()) return false;
    return true;
  });
  if (!acceptedValidation) {
    throw new Error400({ name: "InvalidToken", message: "Invalid Token" });
  }

  let user = await database.user.findUnique({
    where: { phone },
  });
  if (!user) {
    user = await database.user.create({
      data: { phone, username: await findTempUsername() },
    });
  }
  const sessionPayload = { sub: user.id };
  const jwt = encode(sessionPayload);
  setCookie(res, "AvenSession", jwt);
  const { id, username } = user;
  return { sessionPayload, user: { id, username }, jwt };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const action = validatePayload(req.body);
  return await verifyPhone(action, res);
});

export default APIHandler;
