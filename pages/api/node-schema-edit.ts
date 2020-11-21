import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type NodeSchemaEditPayload = {
  address: string[];
  siteName: string;
  schema: any;
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
  };
}

async function nodeSchemaEdit(
  user: APIUser,
  { schema, siteName, address }: NodeSchemaEditPayload,
  res: NextApiResponse
) {
  const whereQ = address.reduce<any>(
    (last: ManyQuery, childKey: string): ManyQuery => {
      return { site: { name: siteName }, parentNode: last, key: childKey };
    },
    null
  ) as ManyQuery;
  if (!whereQ) throw new Error("unknown address");
  await database.siteNode.updateMany({
    where: whereQ,
    data: { schema },
  });

  return {};
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
    }
    await nodeSchemaEdit(verifiedUser, validatePayload(req.body), res);
    return {};
  }
);

export default APIHandler;
