import { NextApiRequest, NextApiResponse } from "next";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { database } from "../../data/database";
import { createAPI } from "../../api-utils/createAPI";

export type SetBioPayload = {
  bio: string;
};

function validatePayload(input: any): SetBioPayload {
  return {
    bio: String(input.bio),
  };
}

async function setBio(
  verifiedUser: APIUser,
  { bio }: SetBioPayload,
  _res: NextApiResponse
) {
  await database.user.update({
    where: { id: verifiedUser.id },
    data: { publicBio: bio },
  });
  return {};
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ message: "No Authenticated User" });
    }
    return await setBio(verifiedUser, validatePayload(req.body), res);
  }
);

export default APIHandler;
