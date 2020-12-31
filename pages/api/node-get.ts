import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error404 } from "../../lib/server/Errors";
import { createAPI } from "../../lib/server/createAPI";
import { NodeSchema } from "../../lib/data/NodeSchema";
import { setAnyCors } from "../../lib/server/cors";
import Ajv from "ajv";
import { siteNodeQuery } from "../../lib/data/SiteNodes";
import { tagSiteRead } from "../../lib/data/SiteEvent";
import getVerifiedUser from "../../lib/server/getVerifedUser";

export type NodeGetPayload = {
  address: string[];
  siteName: string;
  apiToken?: string;
};

const ajv = new Ajv();
const validate = ajv.compile({
  type: "object",
  additionalProperties: false,
  properties: {
    siteName: { type: "string", required: true },
    address: { type: "array", items: { type: "string" }, required: true },
    apiToken: { type: "string", required: false },
  },
});

function validatePayload(input: any): NodeGetPayload {
  if (validate(input)) {
    return input as NodeGetPayload;
  }
  throw new Error(ajv.errorsText());
}

async function nodeGet({ siteName, address }: NodeGetPayload, res: NextApiResponse) {
  const nodesQuery = siteNodeQuery(siteName, address);
  if (!nodesQuery) throw new Error("unknown address");
  const node = await database.siteNode.findFirst({
    where: nodesQuery,
  });
  if (!node) throw new Error404({ message: "Node Not Found", name: "NodeNotFound" });
  const nodeSchema = node.schema as NodeSchema;
  let freshFor = 60 * 10;
  if (nodeSchema.type === "record" && nodeSchema.tti != null) {
    freshFor = nodeSchema.tti;
  }
  return { value: node.value, freshFor };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  setAnyCors(req, res);
  const verifiedUser = await getVerifiedUser(req, res);
  const action = validatePayload(req.body);
  await tagSiteRead(action.siteName, verifiedUser, ":site-schema", action.apiToken);
  return await nodeGet(action, res);
});

export default APIHandler;
