import { NextApiRequest, NextApiResponse } from "next";
import { Error400 } from "../../api-utils/Errors";
import { S3_BUCKET, s3Client } from "../../api-utils/s3Client";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { database } from "../../data/database";
import { createAPI } from "../../api-utils/createAPI";

export type ClipUploadPayload = {};

function validatePayload(_input: any): ClipUploadPayload {
  return {};
}

async function clipUpload(user: APIUser, {}: ClipUploadPayload) {
  if (!s3Client || !S3_BUCKET) {
    throw new Error("S3 not configured");
  }
  const clip = await database.clip.create({
    data: {
      user: { connect: { id: user.id } },
    },
  });
  const uploadURI = await s3Client.presignedPutObject(
    S3_BUCKET,
    `clips/upload/c_${clip.id}.mov`
  );
  return {
    uploadURI,
    clip,
  };
}

const APIHandler = createAPI(
  async (req: NextApiRequest, _res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ message: "No Authenticated User" });
    }
    return await clipUpload(verifiedUser, validatePayload(req.body));
  }
);

export default APIHandler;
