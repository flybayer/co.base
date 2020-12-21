import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type SiteSchemaGetPayload = {
  name: string;
};

function validatePayload(input: any): SiteSchemaGetPayload {
  return { name: input.name };
}

async function siteSchemaGet(user: APIUser | null, { name }: SiteSchemaGetPayload, res: NextApiResponse) {
  const nodes = await database.siteNode.findMany({
    where: { site: { name }, parentNode: null },
    select: { schema: true, key: true },
  });
  const siteSchema = Object.fromEntries(nodes.map((node) => [node.key, node.schema]));
  return {
    siteSchema,
  };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  return await siteSchemaGet(verifiedUser, validatePayload(req.body), res);
});

export default APIHandler;
