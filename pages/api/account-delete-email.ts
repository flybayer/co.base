import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

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
