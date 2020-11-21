import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { DEFAULT_SCHEMA, NodeSchema } from "../../data/NodeSchema";

import Ajv, { JSONSchemaType, DefinedError } from "ajv";
import { InputJsonObject, JsonArray, JsonObject } from "@prisma/client";

const ajv = new Ajv();

export type NodeEditPayload = {
  address: string[];
  siteName: string;
  value: InputJsonObject;
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
  const node = await database.siteNode.findFirst({
    where: whereQ,
    select: { schema: true, id: true },
  });
  const schema = (node?.schema as NodeSchema) || DEFAULT_SCHEMA;
  if (schema.type !== "record")
    throw new Error("may not modify a record set node. use children instead");
  const recordSchema = schema.record;
  if (!recordSchema) throw new Error("internal error. schema not found.");
  const validate = ajv.compile(recordSchema);
  if (!validate(value)) {
    const errors = validate.errors as DefinedError[];
    throw new Error400({
      message: `Invalid: ${errors
        .map((e) => `${e.dataPath} ${e.message}`)
        .join(", ")}`,
      name: "ValidationError",
      data: { validationErrors: errors },
    });
  }
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
      throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
    }
    await nodeEdit(verifiedUser, validatePayload(req.body), res);
    return {};
  }
);

export default APIHandler;
