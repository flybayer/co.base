import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";

export type AccountInfoPayload = {
  name: string;
};

function validatePayload(input: any): AccountInfoPayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",
      name: "NoBody",
    });
  const { name } = input;
  return { name };
}

async function setPublicInfo(user: APIUser, { name }: AccountInfoPayload, res: NextApiResponse) {
  const userUpdate: { name?: string } = {};
  if (name) {
    userUpdate.name = name;
  }
  await database.user.update({
    where: { id: user.id },
    data: userUpdate,
  });
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  return await setPublicInfo(verifiedUser, validatePayload(req.body), res);
});

export default APIHandler;
