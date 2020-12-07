import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { getValueSchema, NodeSchema, NodeType, SchemaType } from "../../data/NodeSchema";

export type NodeCreatePayload = {
  name: string;
  address: string[];
  siteName: string;
  type: NodeType;
  schemaType: SchemaType;
};

export type ManyQuery = null | {
  parentNode: ManyQuery;
  key: string;
  site: { name: string };
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
  user: APIUser,
  { name, siteName, address, type, schemaType }: NodeCreatePayload,
  res: NextApiResponse,
) {
  const whereQ = address.reduce<any>((last: ManyQuery, childKey: string): ManyQuery => {
    return { site: { name: siteName }, parentNode: last, key: childKey };
  }, null) as ManyQuery;
  const nodesResult =
    whereQ &&
    (await database.siteNode.findMany({
      where: whereQ,
      select: { id: true },
    }));
  const parentNodeId = nodesResult && nodesResult[0].id;
  const schema: NodeSchema =
    type === "record-set"
      ? { type: "record-set", childRecord: getValueSchema(schemaType) }
      : { type: "record", record: getValueSchema(schemaType) };

  const resp = await database.siteNode.create({
    data: {
      key: name,
      parentNode: parentNodeId ? { connect: { id: parentNodeId } } : undefined,
      site: { connect: { name: siteName } },
      schema,
    },
    select: {
      id: true,
    },
  });
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await nodeCreate(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
