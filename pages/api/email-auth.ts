import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400, Error500 } from "../../api-utils/Errors";
import { findTempUsername } from "../../api-utils/findTempUsername";
import { parseCookies } from "nookies";
import setCookie from "../../api-utils/setCookie";
import { encode } from "../../api-utils/jwt";

async function emailAuth(
  secret: string,
  parsedCookies: any,
  res: NextApiResponse
) {
  const emailValidation = await database.emailValidation.findOne({
    where: { secret },
  });
  if (!emailValidation) {
    throw new Error400({ message: "Invalid Token" });
  }
  await database.emailValidation.delete({
    where: { secret },
  });
  const { emailTime, email, secret: storedSecret } = emailValidation;
  if (!storedSecret) {
    throw new Error500({ message: "No validation token to compare" });
  }
  if (!email) {
    throw new Error500({ message: "No email to verify" });
  }
  if (storedSecret !== secret) {
    // this should be caught earlier, but just to be safe:
    throw new Error400({ message: "Invalid Token" });
  }
  if (Date.now() - 60 * 60 * 1000 > emailTime.getTime()) {
    throw new Error400({ message: "Invalid Time" });
  }
  const validatedEmail = email; // the validationToken matched. time is good. verification has passed.
  // get user id
  let user = await database.user.findOne({
    where: { email: validatedEmail || undefined },
  });
  let isNewUser = false;
  if (!user) {
    user = await database.user.create({
      data: {
        username: await findTempUsername(),
        name: "",
        email: validatedEmail,
      },
    });
    isNewUser = true;
  }

  const jwt = encode({ sub: user.id });

  setCookie(res, "AvenSession", jwt);
  return {
    validatedEmail,
    username: user.username,
    name: user.name,
    isNewUser,
  };
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  const parsedCookies = parseCookies({ req });
  const token = req.query.token;
  emailAuth(String(token), parsedCookies, res)
    .then(() => {
      res.redirect("/account");
    })
    .catch((err) => {
      console.error(err);
      res.statusCode = 500;
      res.send({});
    });
};
