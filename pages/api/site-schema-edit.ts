import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import { applyPatch } from "fast-json-patch";
import { SchemaEditResponse, startSiteEvent } from "../../lib/data/SiteEvent";
import { SiteSchema } from "../../lib/data/SiteSchema";

export type SiteSchemaEditPayload = {
  siteName: string;
  schema?: SiteSchema;
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
): Promise<SchemaEditResponse> {
  if (schema) {
    await database.site.update({
      where: { name: siteName },
      data: { schema },
    });
    return { schema };
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
    return { schema: newSchema.newDocument as SiteSchema };
  }
  throw new Error400({ name: "SchemaValueOrPatchMissing" });
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  const action = validatePayload(req.body);
  const [resolve, reject] = await startSiteEvent("SchemaEdit", { siteName: action.siteName, user: verifiedUser });
  try {
    const result = await siteSchemaEdit(verifiedUser, action, res);
    resolve(result);
    return result;
  } catch (e) {
    reject(e);
    throw e;
  }
});

export default APIHandler;
