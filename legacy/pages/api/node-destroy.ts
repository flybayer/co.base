import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400, Error500 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import { siteNodeQuery } from "../../lib/data/SiteNodes";
import { startSiteEvent } from "../../lib/data/SiteEvent";
import { getSiteToken } from "../../lib/server/APIToken";
import { NodeDestroyResponse } from "../../lib/data/EventTypes";

export type NodeDestroyPayload = {
  siteName: string;
  address: string[];
};

function validatePayload(input: any): NodeDestroyPayload {
  return { siteName: input.siteName, address: input.address };
}

export async function nodeDelete({ siteName, address }: NodeDestroyPayload): Promise<NodeDestroyResponse> {
  const nodesQuery = siteNodeQuery(siteName, address);
  if (!nodesQuery) {
    throw new Error500({ name: "QueryConstructionFailed", data: { siteName, address } });
  }
  await database.siteNode.deleteMany({
    where: nodesQuery,
  });
  return { address };
}

export async function protectedNodeDelete(
  action: NodeDestroyPayload,
  user: APIUser | null,
  apiToken: string | undefined,
): Promise<NodeDestroyResponse> {
  const actionName = action.address.length === 1 ? "SiteNodeDestroy" : "NodeDestroy";
  const [resolve, reject] = await startSiteEvent(actionName, { siteName: action.siteName, user, apiToken });
  try {
    const result = await nodeDelete(action);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  const action = validatePayload(req.body);
  return await protectedNodeDelete(action, verifiedUser, getSiteToken(req));
});

export default APIHandler;
