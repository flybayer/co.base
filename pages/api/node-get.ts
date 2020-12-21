import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error404 } from "../../api-utils/Errors";
import { createAPI } from "../../api-utils/createAPI";
import { NodeSchema } from "../../data/NodeSchema";
import { setAnyCors } from "../../api-utils/cors";
import Ajv from "ajv";
import { siteNodeQuery } from "../../data/SiteNodes";

export type NodeGetPayload = {
  address: string[];
  siteName: string;
};

const ajv = new Ajv();
const validate = ajv.compile({
  type: "object",
  additionalProperties: false,
  properties: {
    siteName: { type: "string" },
    address: { type: "array", items: { type: "string" } },
  },
});

function validatePayload(input: any): NodeGetPayload {
  if (validate(input)) {
    return input as NodeGetPayload;
  }
  throw new Error(ajv.errorsText());

  // return {
  //   address: input.address,
  //   siteName: input.siteName,
  // };
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
  // const verifiedUser = await getVerifiedUser(req);
  // if (!verifiedUser) {
  //   throw new Error400({ message: "No Authenticated User" });
  // }
  setAnyCors(req, res);

  return await nodeGet(validatePayload(req.body), res);
});

export default APIHandler;
