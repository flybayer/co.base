import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { getRandomLetters } from "../../api-utils/getRandomLetters";
import { SiteTokenType } from "../../data/SiteToken";
import { startSiteEvent, TokenCreateResponse } from "../../data/SiteEvent";

export type SiteTokenCreatePayload = {
  siteName: string;
  label: string;
  type: SiteTokenType;
};

function validatePayload(input: any): SiteTokenCreatePayload {
  return { ...input };
}

async function tokenCreate(
  user: APIUser,
  { siteName, label, type }: SiteTokenCreatePayload,
  res: NextApiResponse,
): Promise<TokenCreateResponse> {
  const token = getRandomLetters(20);
  const t = await database.siteToken.create({
    data: {
      site: { connect: { name: siteName } },
      label,
      type,
      token,
    },
  });
  return { token, tokenId: t.id, label, type };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ name: "NoAuth", message: "No Authenticated User" });
  }
  const action = validatePayload(req.body);
  const [resolve, reject] = await startSiteEvent("TokenCreate", { siteName: action.siteName, user: verifiedUser });
  try {
    const result = await tokenCreate(verifiedUser, action, res);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
});

export default APIHandler;
