import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { getValueSchema, getDefaultValue, NodeSchema, NodeType, SchemaType } from "../../data/NodeSchema";
import { siteNodeQuery } from "../../data/SiteNodes";
import { NodeCreateResponse, startSiteEvent } from "../../data/SiteEvent";

export type NodeCreatePayload = {
  name: string;
  address: string[];
  siteName: string;
  type: NodeType;
  schemaType: SchemaType;
};

function validatePayload(input: any): NodeCreatePayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",
      name: "EmptyPayload",
    });
  const { name } = input;

  const normalized = name.toLowerCase();
  if (!normalized.match(/^[a-z]([a-z0-9-])*[a-z0-9]$/))
    throw new Error400({
      message: "name contains invalid characters.",
      name: "NameValidation",
    });

  return {
    name: normalized,
    address: input.address,
    siteName: input.siteName,
    type: input.type,
    schemaType: input.schemaType,
  };
}

async function nodeCreate(
  { name, siteName, address, type, schemaType }: NodeCreatePayload,
  res: NextApiResponse,
): Promise<NodeCreateResponse> {
  const nodesQuery = siteNodeQuery(siteName, address);
  const parentNode =
    nodesQuery &&
    (await database.siteNode.findFirst({
      where: nodesQuery,
      select: { id: true, schema: true },
    }));
  if (!parentNode && address.length) {
    throw new Error400({ name: "NodeNotFound" });
  }
  const parentSchema: undefined | NodeSchema = parentNode?.schema as NodeSchema | undefined;
  const parentType: NodeType = parentSchema?.type || "folder";
  let schema: null | NodeSchema = null;
  let value: any = undefined;
  if (parentType === "record") {
    throw new Error400({
      name: "RecordsNoChildren",
      message: "Cannot create a node under a record because it has no children.",
    });
  }
  if (parentType === "folder") {
    schema =
      type === "record-set"
        ? { type: "record-set", childRecord: getValueSchema(schemaType) }
        : { type: "record", record: getValueSchema(schemaType) };
  }
  if (parentSchema?.type === "record-set" && parentSchema.childRecord) {
    value = getDefaultValue(parentSchema.childRecord);
  }

  const resp = await database.siteNode.create({
    data: {
      key: name,
      parentNode: parentNode?.id ? { connect: { id: parentNode?.id } } : undefined,
      site: { connect: { name: siteName } },
      schema,
      value,
    },
    select: {
      id: true,
    },
  });
  return {
    nodeId: resp.id,
    address,
    key: name,
    value,
  };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  const action = validatePayload(req.body);
  const actionName = action.address.length ? "NodeCreate" : "SiteNodeCreate";
  const [resolve, reject] = await startSiteEvent(actionName, { siteName: action.siteName, user: verifiedUser });
  try {
    const result = await nodeCreate(action, res);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
});

export default APIHandler;
