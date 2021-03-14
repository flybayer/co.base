import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import { NodeSchema } from "../../packages/client/src/NodeSchema";
import { applyPatch } from "fast-json-patch";
import { siteNodeQuery } from "../../lib/data/SiteNodes";
import { startSiteEvent } from "../../lib/data/SiteEvent";
import { NodeSchemaPutResponse } from "../../lib/data/EventTypes";

export type NodeSchemaPutPayload = {
  address: string[];
  siteName: string;
  schema?: NodeSchema;
  schemaPatch?: any;
};

function validatePayload(input: any): NodeSchemaPutPayload {
  return {
    schema: input.schema,
    address: input.address,
    siteName: input.siteName,
    schemaPatch: input.schemaPatch,
  };
}

async function nodeSchemaPut({
  schema,
  schemaPatch,
  siteName,
  address,
}: NodeSchemaPutPayload): Promise<NodeSchemaPutResponse> {
  const nodesQuery = siteNodeQuery(siteName, address);
  if (!nodesQuery) throw new Error("unknown address");
  const node = await database.siteNode.findFirst({
    where: nodesQuery,
    select: { schema: !!schemaPatch, version: true, schemaVersion: true },
  });
  if (!node) {
    throw new Error400({ message: "Cannot update missing node", name: "NodeNotFound" });
  }

  let newSchema: NodeSchema | undefined = schema;

  if (!newSchema && schemaPatch) {
    const patchedSchema = applyPatch(node.schema as NodeSchema, schemaPatch);
    newSchema = patchedSchema.newDocument;
  }
  if (!newSchema) {
    throw new Error400({ name: "SchemaNorPatchProvided" });
  }
  const updateResp = await database.siteNode.updateMany({
    where: {
      ...nodesQuery,
      version: node.version,
    },
    data: {
      schema: newSchema,
      versionTime: new Date(),
      version: node.version + 1,
      schemaVersion: node.schemaVersion + 1,
    },
  });
  if (updateResp.count < 1) {
    // it should always be 1 when it succeeds..
    throw new Error("Conflict. Avoided multiple simultaneous put requests");
  }
  return { schema: newSchema };
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
    const result = await nodeSchemaPut(action);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
});

export default APIHandler;
