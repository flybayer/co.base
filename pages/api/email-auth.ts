import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400, Error500 } from "../../api-utils/Errors";
import { getTempUsername } from "../../api-utils/findTempUsername";
import { parseCookies } from "nookies";

async function emailAuth(
  validationToken: string,
  parsedCookies: any,
  res: NextApiResponse
) {
  const sessionToValidate = await database.session.findOne({
    where: { validationToken },
  });
  if (!sessionToValidate) {
    throw new Error400({ message: "Invalid Token" });
  }
  const {
    createdAt,
    unvalidatedEmail,
    validationToken: storedValidationToken,
  } = sessionToValidate;
  if (!storedValidationToken) {
    throw new Error500({ message: "No validation token to compare" });
  }
  if (!unvalidatedEmail) {
    throw new Error500({ message: "No email to verify" });
  }
  if (storedValidationToken !== validationToken) {
    // this should be caught earlier, but just to be safe:
    throw new Error400({ message: "Invalid Token" });
  }
  if (Date.now() - 60 * 60 * 1000 > createdAt.getTime()) {
    throw new Error400({ message: "Invalid Time" });
  }
  const validatedEmail = unvalidatedEmail; // the validationToken matched. time is good. verification has passed.
  // get user id
  let user = await database.user.findOne({
    where: { email: validatedEmail || undefined },
  });
  let isNewUser = false;
  if (!user) {
    user = await database.user.create({
      data: {
        username: getTempUsername(),
        name: "",
        email: validatedEmail,
      },
    });
    isNewUser = true;
  }
  await database.session.update({
    where: { id: sessionToValidate.id },
    data: {
      unvalidatedEmail: null,
      validationToken: null,
      verifiedUser: { connect: { id: user.id } },
    },
  });
  return {
    validatedEmail,
    username: user.username,
    name: user.name,
    isNewUser,
  };
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  const parsedCookies = parseCookies({ req });
  const validationToken = req.query.token;
  emailAuth(String(validationToken), parsedCookies, res)
    .then(() => {
      res.redirect("/account");
    })
    .catch((err) => {
      console.error(err);
      res.statusCode = 500;
      res.send({});
    });
};
