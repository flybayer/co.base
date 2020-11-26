import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400, Error500 } from "../../api-utils/Errors";
import { findTempUsername } from "../../api-utils/findTempUsername";
import { parseCookies } from "nookies";
import setCookie from "../../api-utils/setCookie";
import { encode } from "../../api-utils/jwt";
import { createAPI } from "../../api-utils/createAPI";

export async function verifyEmail(secret: string) {
  const userSelectQuery = { name: true, id: true, email: true, username: true };
  const emailValidation = await database.emailValidation.findOne({
    where: { secret },
    include: { user: { select: userSelectQuery } },
  });
  if (!emailValidation) {
    throw new Error400({ message: "Invalid Token", name: "InvalidToken" });
  }
  await database.emailValidation.delete({
    where: { secret },
  });

  const {
    emailTime,
    email,
    user: validatedUser,
    secret: storedSecret,
  } = emailValidation;
  if (!storedSecret) {
    throw new Error500({
      message: "No validation token to compare",
      name: "NoToken",
    });
  }
  if (!email) {
    throw new Error500({ message: "No email to verify", name: "NoEmail" });
  }
  if (storedSecret !== secret) {
    // this should be caught earlier, but just to be safe:
    throw new Error400({ message: "Invalid Token", name: "InvalidToken" });
  }
  if (Date.now() - 60 * 60 * 1000 > emailTime.getTime()) {
    throw new Error400({ message: "Invalid Time", name: "InvalidToken" });
  }

  const verifiedEmail = await database.verifiedEmail.findOne({
    where: { email },
    include: { user: { select: userSelectQuery } },
  });

  let user = verifiedEmail?.user;
  let isNewUser = false;

  if (!user) {
    const primaryEmailUser = await database.user.findOne({
      where: { email },
      select: userSelectQuery,
    });
    if (primaryEmailUser) {
      user = primaryEmailUser;
    }

    if (!user) {
      console.log("creatinguser", { email });
      user = await database.user.create({
        data: {
          username: await findTempUsername(),
          name: "",
          email,
        },
        select: userSelectQuery,
      });
      isNewUser = true;
    }

    await database.verifiedEmail.create({
      data: { email, user: { connect: { id: user.id } } },
    });
  }

  const jwt = encode({ sub: user.id });
  return { verifiedEmail: email, jwt, user, isNewUser };
}

async function emailAuth(
  secret: string,
  parsedCookies: any,
  res: NextApiResponse
) {
  const { verifiedEmail, user, jwt, isNewUser } = await verifyEmail(secret);
  setCookie(res, "AvenSession", jwt);
  return {
    verifiedEmail,
    username: user.username,
    name: user.name,
    isNewUser,
  };
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const parsedCookies = parseCookies({ req });
    const token = req.query.token;
    await emailAuth(String(token), parsedCookies, res);
    res.redirect("/account");
    return res;
  }
);

export default APIHandler;
