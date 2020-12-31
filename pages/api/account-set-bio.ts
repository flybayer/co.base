import { NextApiRequest, NextApiResponse } from "next";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { database } from "../../lib/data/database";
import { createAPI } from "../../lib/server/createAPI";

export type SetBioPayload = {
  bio: string;
};

function validatePayload(input: any): SetBioPayload {
  return {
    bio: String(input.bio),
  };
}

async function setBio(verifiedUser: APIUser, { bio }: SetBioPayload, _res: NextApiResponse) {
  await database.user.update({
    where: { id: verifiedUser.id },
    data: { publicBio: bio },
  });
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  return await setBio(verifiedUser, validatePayload(req.body), res);
});

export default APIHandler;
