import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";

export type NodeEditPayload = {
  address: string[];
  siteName: string;
  value: any;
};

export type ManyQuery = null | {
  parentNode: ManyQuery;
  key: string;
  site: { name: string };
};

function validatePayload(input: any): NodeEditPayload {
  return {
    value: input.value,
    address: input.address,
    siteName: input.siteName,
  };
}

async function nodeEdit(
  user: APIUser,
  { value, siteName, address }: NodeEditPayload,
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
    data: { value },
  });

  return {};
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ message: "No Authenticated User" });
    }
    await nodeEdit(verifiedUser, validatePayload(req.body), res);
    return {};
  }
);

export default APIHandler;
