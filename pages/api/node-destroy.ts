import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { siteNodeQuery } from "../../data/SiteNodes";
import { NodeDestroyResponse, startSiteEvent } from "../../data/SiteEvent";

export type NodeDestroyPayload = {
  siteName: string;
  address: string[];
};

function validatePayload(input: any): NodeDestroyPayload {
  return { siteName: input.siteName, address: input.address };
}

async function nodeDestroy(
  { siteName, address }: NodeDestroyPayload,
  res: NextApiResponse,
): Promise<NodeDestroyResponse> {
  const nodesQuery = siteNodeQuery(siteName, address);
  if (!nodesQuery) {
    throw new Error("could not even construct a wuwqery");
  }
  await database.siteNode.deleteMany({
    where: nodesQuery,
  });
  return { address };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  const action = validatePayload(req.body);
  const actionName = action.address.length === 1 ? "SiteNodeDestroy" : "NodeDestroy";
  const [resolve, reject] = await startSiteEvent(actionName, { siteName: action.siteName, user: verifiedUser });
  try {
    const result = await nodeDestroy(action, res);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
});

export default APIHandler;
