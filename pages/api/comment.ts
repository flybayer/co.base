import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import { apiRespond } from "../../api-utils/apiRespond";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";

export type CommentPayload = {
  message: string;
  page: string;
};

function validatePayload(input: any): CommentPayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",
      field: "email",
    });
  const { message, page } = input;
  if (!message) {
    throw new Error400({ message: "Empty comment message! " });
  }
  if (!page) {
    throw new Error400({ message: "No page destination! " });
  }
  return { message, page };
}

async function publishComment(
  user: APIUser,
  { message, page }: CommentPayload,
  res: NextApiResponse
) {
  const comment = await database.comment.create({
    data: {
      user: { connect: { id: user.id } },
      message,
      page,
    },
  });
  return { id: comment.id };
}

async function handleActionPayload(req: NextApiRequest, res: NextApiResponse) {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User" });
  }
  return await publishComment(verifiedUser, validatePayload(req.body), res);
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  apiRespond(res, handleActionPayload(req, res));
};
