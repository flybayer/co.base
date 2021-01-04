import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import { NodeSchema } from "../../lib/data/NodeSchema";
import { applyPatch } from "fast-json-patch";
import { siteNodeQuery } from "../../lib/data/SiteNodes";
import { startSiteEvent } from "../../lib/data/SiteEvent";
import { NodeSchemaEditResponse } from "../../lib/data/EventTypes";

export type NodeSchemaEditPayload = {
  address: string[];
  siteName: string;
  schema?: NodeSchema;
  schemaPatch?: any;
};

function validatePayload(input: any): NodeSchemaEditPayload {
  return {
    schema: input.schema,
    address: input.address,
    siteName: input.siteName,
    schemaPatch: input.schemaPatch,
  };
}

async function nodeSchemaEdit({
  schema,
  schemaPatch,
  siteName,
  address,
}: NodeSchemaEditPayload): Promise<NodeSchemaEditResponse> {
  const nodesQuery = siteNodeQuery(siteName, address);
  if (!nodesQuery) throw new Error("unknown address");
  if (schema) {
    await database.siteNode.updateMany({
      where: nodesQuery,
      data: { schema },
    });
    return { schema };
  } else if (schemaPatch) {
    const prevNode = await database.siteNode.findFirst({
      where: nodesQuery,
      select: { id: true, schema: true }, // todo: save a version number. then when doing the write, add a where version clause so that race conditions are avoided. also for values of course.
    });
    if (!prevNode) {
      throw new Error400({ message: "Cannot patch missing schema", name: "SchemaNotFound" });
    }
    const newSchema = applyPatch(prevNode.schema, schemaPatch);
    await database.siteNode.updateMany({
      where: nodesQuery,
      data: { schema: newSchema.newDocument },
    });
    return { schema: newSchema.newDocument };
  }
  throw new Error400({ name: "SchemaNorPatchProvided" });
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  const action = validatePayload(req.body);
  const [resolve, reject] = await startSiteEvent("NodeSchemaEdit", {
    siteName: action.siteName,
    user: verifiedUser,
    address: action.address,
  });
  try {
    const result = await nodeSchemaEdit(action);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
});

export default APIHandler;
