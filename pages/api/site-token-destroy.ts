import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import { startSiteEvent, TokenDestroyResponse } from "../../lib/data/SiteEvent";

export type SiteTokenDestroyPayload = {
  siteName: string;
  tokenId: number;
};

function validatePayload(input: any): SiteTokenDestroyPayload {
  return { tokenId: input.tokenId, siteName: input.siteName };
}

async function tokenDestroy(
  user: APIUser,
  { tokenId }: SiteTokenDestroyPayload,
  res: NextApiResponse,
): Promise<TokenDestroyResponse> {
  await database.siteToken.delete({
    where: { id: tokenId },
  });
  return { tokenId };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);

  if (!verifiedUser) {
    throw new Error400({ name: "NoAuth", message: "No Authenticated User" });
  }
  const action = validatePayload(req.body);
  const [resolve, reject] = await startSiteEvent("TokenDestroy", { siteName: action.siteName, user: verifiedUser });
  try {
    const result = await tokenDestroy(verifiedUser, action, res);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
});

export default APIHandler;
