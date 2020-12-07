import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { NodeSchema } from "../../data/NodeSchema";
import { applyPatch } from "fast-json-patch";

export type NodeSchemaEditPayload = {
  address: string[];
  siteName: string;
  schema?: NodeSchema;
  schemaPatch?: any;
};

export type ManyQuery = null | {
  parentNode: ManyQuery;
  key: string;
  site: { name: string };
};

function validatePayload(input: any): NodeSchemaEditPayload {
  return {
    schema: input.schema,
    address: input.address,
    siteName: input.siteName,
    schemaPatch: input.schemaPatch,
  };
}

async function nodeSchemaEdit(
  user: APIUser,
  { schema, schemaPatch, siteName, address }: NodeSchemaEditPayload,
  res: NextApiResponse,
) {
  const whereQ = address.reduce<any>((last: ManyQuery, childKey: string): ManyQuery => {
    return { site: { name: siteName }, parentNode: last, key: childKey };
  }, null) as ManyQuery;
  if (!whereQ) throw new Error("unknown address");
  if (schema) {
    await database.siteNode.updateMany({
      where: whereQ,
      data: { schema },
    });
  } else if (schemaPatch) {
    const prevNode = await database.siteNode.findFirst({
      where: whereQ,
      select: { id: true, schema: true }, // todo: save a version number. then when doing the write, add a where version clause so that race conditions are avoided. also for values of course.
    });
    if (!prevNode) {
      throw new Error400({ message: "Cannot patch missing schema", name: "SchemaNotFound" });
    }
    const newSchema = applyPatch(prevNode.schema, schemaPatch);
    await database.siteNode.updateMany({
      where: whereQ,
      data: { schema: newSchema.newDocument },
    });
  }

  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await nodeSchemaEdit(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
