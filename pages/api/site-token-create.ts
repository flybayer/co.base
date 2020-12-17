import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { getRandomLetters } from "../../api-utils/getRandomLetters";

export type SiteTokenCreatePayload = {
  siteName: string;
  label: string;
  type: string;
};

export type SiteTokenCreateResponse = {
  token: string;
  id: number;
};

function validatePayload(input: any): SiteTokenCreatePayload {
  return { ...input };
}

async function tokenCreate(
  user: APIUser,
  { siteName, label, type }: SiteTokenCreatePayload,
  res: NextApiResponse,
): Promise<SiteTokenCreateResponse> {
  const token = getRandomLetters(20);
  const t = await database.siteToken.create({
    data: {
      site: { connect: { name: siteName } },
      label,
      type,
      token,
    },
  });
  return { token, id: t.id };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ name: "NoAuth", message: "No Authenticated User" });
  }
  return await tokenCreate(verifiedUser, validatePayload(req.body), res);
});

export default APIHandler;
