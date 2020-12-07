import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type UsernamePayload = {
  username: string;
};

function validatePayload(input: any): UsernamePayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",
      name: "NoBody",
    });
  const { username } = input;

  if (username.length < 4)
    throw new Error400({
      message: "Username is too short.",

      name: "BadEmailShort",
    });
  if (username.length > 30)
    throw new Error400({
      message: "Username is too long.",
      name: "BadEmailLong",
    });

  const normalizedUsername = username.toLowerCase();
  if (!normalizedUsername.match(/^[a-z]([a-z0-9-])*[a-z0-9]$/))
    throw new Error400({
      message: "Username contains invalid characters.",
      name: "BadEmail",
    });

  return { username: normalizedUsername };
}

async function setUsername(user: APIUser, { username }: UsernamePayload, res: NextApiResponse) {
  await database.user.update({
    where: { id: user.id },
    data: { username },
  });
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await setUsername(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
