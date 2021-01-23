import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";

export type AccountInfoPayload = {
  name?: string;
  bio?: string;
};

function validatePayload(input: any): AccountInfoPayload {
  const { name, bio } = input;
  return { name, bio };
}

async function setPublicInfo(user: APIUser, { name, bio }: AccountInfoPayload, res: NextApiResponse) {
  const updates: { name?: string; bio?: string } = {};
  if (bio) {
    updates.bio = bio;
  }
  if (name) {
    updates.name = name;
  }
  await database.user.update({
    where: { id: user.id },
    data: updates,
  });
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  return await setPublicInfo(verifiedUser, validatePayload(req.body), res);
});

export default APIHandler;
