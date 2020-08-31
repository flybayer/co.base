import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { sendEmail } from "../../api-utils/email";
import { getRandomLetters } from "../../api-utils/getRandomLetters";
import { Error400 } from "../../api-utils/Errors";
import { apiRespond } from "../../api-utils/apiRespond";
import setCookie from "../../api-utils/setCookie";
import getSiteLink from "../../api-utils/getSiteLink";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";

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

async function handleActionPayload(req: NextApiRequest, res: NextApiResponse) {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User" });
  }
  return await setPublicInfo(verifiedUser, validatePayload(req.body), res);
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  apiRespond(res, handleActionPayload(req, res));
};
