import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";

export type SiteCreatePayload = {
  name: string;
};

function validatePayload(input: any): SiteCreatePayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",
      name: "NoPayload",
    });
  const { name } = input;

  if (name.length < 4)
    throw new Error400({
      message: "name is too short.",
      name: "NameValidation",
    });
  if (name.length > 30)
    throw new Error400({
      message: "name is too long.",
      name: "NameValidation",
    });

  const normalized = name.toLowerCase();
  if (!normalized.match(/^[a-z]([a-z0-9-])*[a-z0-9]$/))
    throw new Error400({
      message: "name contains invalid characters.",
      name: "NameValidation",
    });

  return { name: normalized };
}

async function siteCreate(user: APIUser, { name }: SiteCreatePayload, res: NextApiResponse) {
  try {
    await database.site.create({
      data: { name, owner: { connect: { id: user.id } } },
    });
  } catch (e) {
    if (e.code === "P2002" && e.meta.target[0] === "name") {
      throw new Error400({ message: "Site name unavailable", name: "SiteNameTaken" });
    }
  }
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  await siteCreate(verifiedUser, validatePayload(req.body), res);
  return {};
});

export default APIHandler;
