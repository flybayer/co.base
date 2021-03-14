import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import bcrypt from "bcrypt";

export type SetPasswordPayload = {
  password: string;
};

function validatePayload(input: any): SetPasswordPayload {
  return { password: String(input.password) };
}

async function setPassword(user: APIUser, { password }: SetPasswordPayload, res: NextApiResponse) {
  const passwordHash = await new Promise<string>((resolve, reject) =>
    bcrypt.hash(password, 14, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    }),
  );
  await database.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await setPassword(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
