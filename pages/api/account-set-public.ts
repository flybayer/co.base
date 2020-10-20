import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type AccountInfoPayload = {
  name: string;
};

function validatePayload(input: any): AccountInfoPayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",
      field: "email",
    });
  const { name } = input;
  return { name };
}

async function setPublicInfo(
  user: APIUser,
  { name }: AccountInfoPayload,
  res: NextApiResponse
) {
  const userUpdate: { name?: string } = {};
  if (name) {
    userUpdate.name = name;
  }
  await database.user.update({
    where: { id: user.id },
    data: userUpdate,
  });
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ message: "No Authenticated User" });
    }
    return await setPublicInfo(verifiedUser, validatePayload(req.body), res);
  }
);

export default APIHandler;
