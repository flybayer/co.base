import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { ManyQuery } from "./node-create";

export type NodeDestroyPayload = {
  siteName: string;
  address: string[];
};

function validatePayload(input: any): NodeDestroyPayload {
  return { siteName: input.siteName, address: input.address };
}

async function nodeDestroy(
  user: APIUser,
  { siteName, address }: NodeDestroyPayload,
  res: NextApiResponse
) {
  const whereQ = address.reduce<any>(
    (last: ManyQuery, childKey: string): ManyQuery => {
      return { site: { name: siteName }, parentNode: last, key: childKey };
    },
    null
  ) as ManyQuery;
  if (!whereQ) {
    throw new Error("could not even construct a wuwqery");
  }
  await database.siteNode.deleteMany({
    where: whereQ,
  });
}

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const verifiedUser = await getVerifiedUser(req);
    if (!verifiedUser) {
      throw new Error400({ message: "No Authenticated User" });
    }
    await nodeDestroy(verifiedUser, validatePayload(req.body), res);
    return {};
  }
);

export default APIHandler;
