import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { startSiteEvent, TokenDestroyResponse } from "../../data/SiteEvent";

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
  const verifiedUser = await getVerifiedUser(req);

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
