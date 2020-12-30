import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400, Error404 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import { DEFAULT_SCHEMA, NodeSchema, ValueSchema } from "../../lib/data/NodeSchema";

import Ajv, { DefinedError } from "ajv";
import { InputJsonObject } from "@prisma/client";
import { digSchemas, parentNodeSchemaQuery, siteNodeQuery } from "../../lib/data/SiteNodes";
import { NodeEditResponse, startSiteEvent } from "../../lib/data/SiteEvent";

const ajv = new Ajv();

export type NodeEditPayload = {
  address: string[];
  siteName: string;
  value: InputJsonObject;
};

function validatePayload(input: any): NodeEditPayload {
  return {
    value: input.value,
    address: input.address,
    siteName: input.siteName,
  };
}

export async function nodePut({ value, siteName, address }: NodeEditPayload): Promise<NodeEditResponse> {
  const nodesQuery = siteNodeQuery(siteName, address);
  if (!nodesQuery) throw new Error("unknown address");
  const node = await database.siteNode.findFirst({
    where: nodesQuery,
    select: { schema: true, id: true, ...parentNodeSchemaQuery },
  });
  if (!node) throw new Error404({ name: "NodeNotFound" });
  const parentSchemas = digSchemas(node.parentNode as any);
  let recordSchema: ValueSchema | null = null;
  if (parentSchemas[0]?.type === "record-set") {
    if (parentSchemas[0]?.childRecord) recordSchema = parentSchemas[0]?.childRecord;
  } else {
    const schema = (node?.schema as NodeSchema) || DEFAULT_SCHEMA;
    if (schema.type !== "record")
      throw new Error400({
        name: "RecordSetNoValue",
        message: `The record set "${address.join(
          "/",
        )}" does not have a value. Create and list use children records instead.`,
      });
    if (schema.record) recordSchema = schema.record;
  }
  if (!recordSchema) throw new Error("internal error. schema not found.");
  const validate = ajv.compile(recordSchema);
  if (!validate(value)) {
    const errors = validate.errors as DefinedError[];
    throw new Error400({
      message: `Invalid: ${errors.map((e) => `${e.dataPath} ${e.message}`).join(", ")}`,
      name: "ValidationError",
      data: { validationErrors: errors },
    });
  }
  await database.siteNode.updateMany({
    where: nodesQuery,
    data: { value },
  });
  return { value };
}

export async function protectedNodePut(action: NodeEditPayload, user: APIUser | null): Promise<NodeEditResponse> {
  const [resolve, reject] = await startSiteEvent("NodeEdit", {
    siteName: action.siteName,
    user,
    address: action.address,
  });
  try {
    const result = await nodePut(action);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
}
const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  const action = validatePayload(req.body);
  return await protectedNodePut(action, verifiedUser);
});

export default APIHandler;
