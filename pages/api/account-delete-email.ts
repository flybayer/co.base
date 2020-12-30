import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";

export type DeleteEmailPayload = {
  email: string;
};

function validatePayload(input: any): DeleteEmailPayload {
  return { email: String(input.email) };
}

async function accountDeleteEmail(user: APIUser, { email }: DeleteEmailPayload, res: NextApiResponse) {
  await database.verifiedEmail.deleteMany({
    where: { email, user: { id: user.id } },
  });
  await database.emailValidation.deleteMany({
    where: { email, user: { id: user.id } },
  });
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await accountDeleteEmail(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
