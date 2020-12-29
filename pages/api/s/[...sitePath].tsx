import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "../../../api-utils/APIToken";
import { createAPI } from "../../../api-utils/createAPI";
import { Error400, Error404 } from "../../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import { database } from "../../../data/database";
import { tagSiteRead } from "../../../data/SiteEvent";
import { siteNodeQuery } from "../../../data/SiteNodes";
import { protectedNodeDelete } from "../node-destroy";
import { protectedNodePut } from "../node-edit";

type QueryContext = {
  siteName: string;
  user: APIUser | null;
  token?: string;
};

async function siteRootQuery({ siteName }: QueryContext) {
  return { siteName };
}

async function schemaQuery({ siteName, user, token }: QueryContext, address: string[]) {
  await tagSiteRead(siteName, user, address.join("/") + "/_schema", token);
  if (!address.length) {
    const site = await database.site.findUnique({ where: { name: siteName }, select: { schema: true } });
    if (!site) throw new Error404({ name: "SiteNotFound" });
    return { schema: site.schema };
  }
  const nodeQuery = siteNodeQuery(siteName, address);
  if (!nodeQuery) throw new Error404({ name: "NodeNotFound" });
  const node = await database.siteNode.findFirst({
    where: nodeQuery,
    select: {
      schema: true,
    },
  });
  if (!node) throw new Error404({ name: "NodeNotFound" });
  return { schema: node?.schema };
}

async function nodeQuery({ siteName, user, token }: QueryContext, address: string[]) {
  await tagSiteRead(siteName, user, address.join("/"), token);
  if (!address.length) {
    throw new Error404({ name: "RootQueryDisallowed" });
  }
  const nodeQuery = siteNodeQuery(siteName, address);
  if (!nodeQuery) throw new Error404({ name: "NodeNotFound" });
  const node = await database.siteNode.findFirst({
    where: nodeQuery,
    select: {
      value: true,
    },
  });
  if (!node) throw new Error404({ name: "NodeNotFound" });
  return { value: node?.value, token, user };
}

async function putNode({ siteName, user, token }: QueryContext, address: string[], value: any) {
  return { siteName, user, token, address, value };
}

async function deleteNode({ siteName, user, token }: QueryContext, address: string[]) {
  return { siteName, user, token, address };
}

async function childrenQuery({ siteName, user, token }: QueryContext, address: string[]) {
  await tagSiteRead(siteName, user, address.join("/") + "/_children", token);
  if (!address.length) {
    const nodes = await database.siteNode.findMany({
      where: { parentNode: null, site: { name: siteName } },
      select: { key: true },
    });
    return {
      nodes: nodes.map((node) => {
        return { key: node.key };
      }),
    };
  }
  const nodeQuery = siteNodeQuery(siteName, address);
  if (!nodeQuery) throw new Error404({ name: "NodeNotFound" });
  const node = await database.siteNode.findFirst({
    where: nodeQuery,
    select: {
      value: true,
      schema: true,
      id: true,
      SiteNode: {
        select: { key: true },
      },
    },
  });
  if (!node) throw new Error404({ name: "NodeNotFound" });
  return { nodes: node.SiteNode };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const sitePath = req.query.sitePath;
  const user = await getVerifiedUser(req);
  const [siteName, ...address] = typeof sitePath === "string" ? [sitePath] : sitePath;
  const token = getToken(req);
  const queryContext = {
    user,
    token,
    siteName,
  };
  if (req.method === "PUT") {
    const payload = req.body;
    return await protectedNodePut({ siteName, address, ...payload }, user);
  }
  if (req.method === "DELETE") {
    // return await deleteNode(queryContext, address);
    return await protectedNodeDelete({ siteName, address }, user, token);
  }
  if (req.method !== "GET") {
    throw new Error400({ name: "MethodNotImplemented" });
  }
  if (!address.length) {
    return await siteRootQuery(queryContext);
  }

  const lastAddressTerm = address[address.length - 1];

  if (lastAddressTerm === "_children") {
    const nodeAddress = address.slice(0, -1);
    return await childrenQuery(queryContext, nodeAddress);
  }
  if (lastAddressTerm === "_schema") {
    const nodeAddress = address.slice(0, -1);
    return await schemaQuery(queryContext, nodeAddress);
  }

  return await nodeQuery(queryContext, address);
});

export default APIHandler;
