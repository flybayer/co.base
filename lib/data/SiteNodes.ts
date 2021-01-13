import { NodeSchema } from "../../packages/client/src/NodeSchema";

export type ManyQuery = null | {
  parentNode: ManyQuery;
  key: string;
  site: { name: string };
};

export function siteNodeQuery(siteName: string, address: string[]): ManyQuery {
  const whereQ = address.reduce<any>((last: ManyQuery, childKey: string): ManyQuery => {
    return { site: { name: siteName }, parentNode: last, key: childKey };
  }, null) as ManyQuery;
  return whereQ;
}

interface NodeWithSchema {
  schema?: NodeSchema;
  parentNode: null | NodeWithSchema;
}

export function digSchemas(node: null | NodeWithSchema, rest: (NodeSchema | null)[] = []): (NodeSchema | null)[] {
  if (node === null) return rest;
  return digSchemas(node.parentNode, [node.schema || null, ...rest]);
}

export const parentNodeSchemaQuery = {
  parentNode: {
    select: {
      schema: true,
      parentNode: {
        select: {
          schema: true,
          // should we go deeper? is there a limit to folder depth?
          // records have no children. Record sets have a single level of children. folders are arbitrary, in theory, but they are not yet exposed to the users as a feature.
          parentNode: { select: { schema: true } },
        },
      },
    },
  },
};
