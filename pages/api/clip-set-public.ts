import { NextApiRequest, NextApiResponse } from "next";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { database } from "../../data/database";
import { createAPI } from "../../api-utils/createAPI";

export type ClipSetPublicPayload = {
  clipId: number;
  isPublished: boolean;
};

function validatePayload(input: any): ClipSetPublicPayload {
  return {
    clipId: Number(input.clipId),
    isPublished: Boolean(input.isPublished),
  };
}

async function clipSetPublic(
  verifiedUser: APIUser,
  { clipId, isPublished }: ClipSetPublicPayload,
  res: NextApiResponse,
) {
  if (!verifiedUser) {
    throw new Error("Not logged in");
  }
  const clip = await database.clip.findUnique({
    where: { id: clipId },
  });
  if (clip?.userId !== verifiedUser.id) {
    throw new Error("Wrong clip ownership");
  }
  await database.clip.update({
    where: { id: clipId },
    data: { publishTime: isPublished ? new Date() : null },
  });
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  return await clipSetPublic(verifiedUser, validatePayload(req.body), res);
});

export default APIHandler;
