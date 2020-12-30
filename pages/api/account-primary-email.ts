import { NextApiRequest, NextApiResponse } from "next";
import { Error400, Error500 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";

export type PrimaryEmailPayload = {
  email: string;
};

function validatePayload(input: any): PrimaryEmailPayload {
  return { email: String(input.email) };
}

async function accountSetPrimaryEmail(user: APIUser, { email }: PrimaryEmailPayload, res: NextApiResponse) {
  // This feature is UN-IMPLEMENTED because paddle does not allow the primary email to change. maybe this can be revisited later
  throw new Error500({ name: "Unimplemented" });
  // const verifiedList = await database.verifiedEmail.findMany({
  //   where: { email, user: { id: user.id } },
  // });
  // const verified = verifiedList[0];
  // if (verified && verified.email === email && verified.userId === user.id) {
  //   await database.user.update({ where: { id: user.id }, data: { email } });
  // }
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await accountSetPrimaryEmail(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
