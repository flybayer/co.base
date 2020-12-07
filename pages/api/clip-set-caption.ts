import { NextApiRequest, NextApiResponse } from "next";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { database } from "../../data/database";
import { createAPI } from "../../api-utils/createAPI";

export type ClipSetCaptionPayload = {
  clipId: number;
  caption: string;
};

function validatePayload(input: any): ClipSetCaptionPayload {
  return {
    clipId: Number(input.clipId),
    caption: String(input.caption),
  };
}

async function clipSetCaption(
  verifiedUser: APIUser,
  { clipId, caption }: ClipSetCaptionPayload,
  _res: NextApiResponse,
) {
  const clip = await database.clip.findUnique({
    where: { id: clipId },
  });
  if (clip?.userId !== verifiedUser.id) {
    throw new Error("Wrong clip ownership");
  }
  await database.clip.update({
    where: { id: clipId },
    data: { caption },
  });
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  return await clipSetCaption(verifiedUser, validatePayload(req.body), res);
});

export default APIHandler;
