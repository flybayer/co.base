import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import { getValueSchema, getDefaultValue, NodeSchema, NodeType, SchemaType } from "../../lib/data/NodeSchema";
import { siteNodeQuery } from "../../lib/data/SiteNodes";
import { NodePostResponse, startSiteEvent } from "../../lib/data/SiteEvent";
import { getRandomLetters } from "../../lib/server/getRandomLetters";
import { getSiteToken } from "../../lib/server/APIToken";

export type NodePostPayload = {
  name?: string;
  address: string[];
  siteName: string;
  type: NodeType;
  schemaType: SchemaType;
  // value: any;
};

function validatePayload(input: any): NodePostPayload {
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
    // value: input.value,
  };
}

export async function nodePost({
  name,
  siteName,
  address,
  type,
  schemaType,
}: // value,
NodePostPayload): Promise<NodePostResponse> {
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

  const key = name == null ? getRandomLetters(8) : name;

  const resp = await database.siteNode.create({
    data: {
      key,
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
    key,
    value,
  };
}

export async function protectedNodePost(
  action: NodePostPayload,
  user: APIUser | null,
  apiToken: string | undefined,
): Promise<NodePostResponse> {
  const actionName = action.address.length ? "NodePost" : "SiteNodePost";
  const [resolve, reject] = await startSiteEvent(actionName, { siteName: action.siteName, user: user, apiToken });
  try {
    const result = await nodePost(action);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
}
const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  const action = validatePayload(req.body);
  return protectedNodePost(action, verifiedUser, getSiteToken(req));
});

export default APIHandler;
