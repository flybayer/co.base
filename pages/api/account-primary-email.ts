import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type PrimaryEmailPayload = {
  email: string;
};

function validatePayload(input: any): PrimaryEmailPayload {
  return { email: String(input.email) };
}

async function accountSetPrimaryEmail(
  user: APIUser,
  { email }: PrimaryEmailPayload,
  res: NextApiResponse
) {
  const verifiedList = await database.verifiedEmail.findMany({
    where: { email, user: { id: user.id } },
  });
  const verified = verifiedList[0];
  if (verified && verified.email === email && verified.userId === user.id) {
    await database.user.update({ where: { id: user.id }, data: { email } });
  }
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ message: "No Authenticated User" });
    }
    await accountSetPrimaryEmail(verifiedUser, validatePayload(req.body), res);
    return {};
  }
);

export default APIHandler;
