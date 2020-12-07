import { NextApiRequest, NextApiResponse } from "next";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { database } from "../../data/database";
import { createAPI } from "../../api-utils/createAPI";

export type ClipSetTagsPayload = {
  clipId: number;
  tags: string[];
};

function validatePayload(input: any): ClipSetTagsPayload {
  return {
    clipId: Number(input.clipId),
    tags: input.tags,
  };
}

async function clipSetTags(verifiedUser: APIUser, { clipId, tags }: ClipSetTagsPayload, _res: NextApiResponse) {
  if (!verifiedUser) {
    throw new Error("Not logged in");
  }
  const clip = await database.clip.findOne({
    where: { id: clipId },
    include: {
      tags: {
        select: { tag: true },
      },
    },
  });
  if (clip?.userId !== verifiedUser.id) {
    throw new Error("Wrong clip ownership");
  }
  console.log(clip, tags);
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  return await clipSetTags(verifiedUser, validatePayload(req.body), res);
});

export default APIHandler;
