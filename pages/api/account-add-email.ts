import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import bcrypt from "bcrypt";
import { getRandomLetters } from "../../api-utils/getRandomLetters";
import { sendEmail } from "../../api-utils/email";
import getSiteLink from "../../api-utils/getSiteLink";

export type AddEmailPayload = {
  email: string;
};

function validatePayload(input: any): AddEmailPayload {
  return { email: String(input.email) };
}

async function addEmail(
  user: APIUser,
  { email }: AddEmailPayload,
  res: NextApiResponse
) {
  const validationToken = getRandomLetters(32);

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
  
  ${getSiteLink(`/account/verify?token=${validationToken}`)}
  `
  );
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
    }
    await addEmail(verifiedUser, validatePayload(req.body), res);
    return {};
  }
);

export default APIHandler;
