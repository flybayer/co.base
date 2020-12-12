import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { siteNodeQuery } from "../../data/SiteNodes";

export type NodeDestroyPayload = {
  siteName: string;
  address: string[];
};

function validatePayload(input: any): NodeDestroyPayload {
  return { siteName: input.siteName, address: input.address };
}

async function nodeDestroy(user: APIUser, { siteName, address }: NodeDestroyPayload, res: NextApiResponse) {
  const nodesQuery = siteNodeQuery(siteName, address);
  if (!nodesQuery) {
    throw new Error("could not even construct a wuwqery");
  }
  await database.siteNode.deleteMany({
    where: nodesQuery,
  });
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await nodeDestroy(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
