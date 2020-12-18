import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { NodeSchema } from "../../data/NodeSchema";
import { applyPatch } from "fast-json-patch";

export type SiteSchemaEditPayload = {
  siteName: string;
  schema?: NodeSchema;
  schemaPatch?: any;
};

function validatePayload(input: any): SiteSchemaEditPayload {
  return {
    schema: input.schema,
    siteName: input.siteName,
    schemaPatch: input.schemaPatch,
  };
}

async function siteSchemaEdit(
  user: APIUser,
  { schema, schemaPatch, siteName }: SiteSchemaEditPayload,
  res: NextApiResponse,
) {
  if (schema) {
    await database.site.update({
      where: { name: siteName },
      data: { schema },
    });
  } else if (schemaPatch) {
    const prevNode = await database.site.findFirst({
      where: { name: siteName },
      select: { id: true, schema: true }, // todo: save a version number. then when doing the write, add a where version clause so that race conditions are avoided. also for values of course.
    });
    if (!prevNode) {
      throw new Error400({ message: "Cannot patch missing schema", name: "SchemaNotFound" });
    }
    const newSchema = applyPatch(prevNode.schema, schemaPatch);
    await database.site.updateMany({
      where: { name: siteName },
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
  await siteSchemaEdit(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
