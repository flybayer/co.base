import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";
import { Error400 } from "../../lib/server/Errors";
import { tagSiteRead } from "../../lib/data/SiteEvent";

export type SiteSchemaGetPayload = {
  siteName: string;
};

function validatePayload(input: any): SiteSchemaGetPayload {
  return { siteName: input.siteName };
}

async function siteSchemaGet(user: APIUser | null, { siteName }: SiteSchemaGetPayload, res: NextApiResponse) {
  const site = await database.site.findUnique({ where: { name: siteName }, select: { schema: true } });
  if (!site) throw new Error400({ name: "SiteNotFound" });

  const nodes = await database.siteNode.findMany({
    where: { site: { name: siteName }, parentNode: null },
    select: { schema: true, key: true },
  });
  const nodeSchemas = Object.fromEntries(nodes.map((node) => [node.key, node.schema]));
  return {
    nodes: nodeSchemas,
    schema: site.schema,
  };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);

  // uh is verifiedUser null.. todo. kill this whole file, move to the REST api

  const action = validatePayload(req.body);
  await tagSiteRead(action.siteName, verifiedUser, ":site-schema", undefined);
  return await siteSchemaGet(verifiedUser, action, res);
});

export default APIHandler;
