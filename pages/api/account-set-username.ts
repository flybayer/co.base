import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { sendEmail } from "../../api-utils/email";
import { getRandomLetters } from "../../api-utils/getRandomLetters";
import { Error400 } from "../../api-utils/Errors";
import { apiRespond } from "../../api-utils/apiRespond";
import setCookie from "../../api-utils/setCookie";
import getSiteLink from "../../api-utils/getSiteLink";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";

export type UsernamePayload = {
  username: string;
};

function validatePayload(input: any): UsernamePayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",
      field: "email",
    });
  const { username } = input;

  if (username.length < 4)
    throw new Error400({
      message: "Username is too short.",
      field: "username",
    });
  if (username.length > 30)
    throw new Error400({
      message: "Username is too long.",
      field: "username",
    });

  const normalizedUsername = username.toLowerCase();
  if (!normalizedUsername.match(/^[a-z]([a-z0-9-])*[a-z0-9]$/))
    throw new Error400({
      message: "Username contains invalid characters.",
      field: "username",
    });

  return { username: normalizedUsername };
}

async function setUsername(
  user: APIUser,
  { username }: UsernamePayload,
  res: NextApiResponse
) {
  await database.user.update({
    where: { id: user.id },
    data: { username },
  });
}

async function handleActionPayload(req: NextApiRequest, res: NextApiResponse) {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User" });
  }
  return await setUsername(verifiedUser, validatePayload(req.body), res);
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  apiRespond(res, handleActionPayload(req, res));
};
