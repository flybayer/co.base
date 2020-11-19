import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type NodeCreatePayload = {
  name: string;
  address: string[];
  siteName: string;
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
      field: "email",
    });
  const { name } = input;

  const normalized = name.toLowerCase();
  if (!normalized.match(/^[a-z]([a-z0-9-])*[a-z0-9]$/))
    throw new Error400({
      message: "name contains invalid characters.",
      field: "name",
    });

  return { name: normalized, address: input.address, siteName: input.siteName };
}

async function nodeCreate(
  user: APIUser,
  { name, siteName, address }: NodeCreatePayload,
  res: NextApiResponse
) {
  const whereQ = address.reduce<any>(
    (last: ManyQuery, childKey: string): ManyQuery => {
      return { site: { name: siteName }, parentNode: last, key: childKey };
    },
    null
  ) as ManyQuery;
  const nodesResult =
    whereQ &&
    (await database.siteNode.findMany({
      where: whereQ,
      select: { id: true },
    }));
  const parentNodeId = nodesResult && nodesResult[0].id;
  const resp = await database.siteNode.create({
    data: {
      key: name,
      parentNode: parentNodeId ? { connect: { id: parentNodeId } } : undefined,
      site: { connect: { name: siteName } },
    },
    select: {
      id: true,
    },
  });
  return {};
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ message: "No Authenticated User" });
    }
    await nodeCreate(verifiedUser, validatePayload(req.body), res);
    return {};
  }
);

export default APIHandler;
