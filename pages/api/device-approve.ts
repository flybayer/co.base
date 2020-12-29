import { NextApiRequest, NextApiResponse } from "next";
import { createAPI } from "../../api-utils/createAPI";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { database } from "../../data/database";

export type DeviceApprovePayload = {
  token: string;
  name: string;
};

export type DeviceApproveResponse = unknown;

function validatePayload(input: any): DeviceApprovePayload {
  return { ...input };
}

async function deviceApprove({ token, name }: DeviceApprovePayload, user: APIUser): Promise<DeviceApproveResponse> {
  await database.deviceToken.update({
    where: { token },
    data: {
      user: { connect: { id: user.id } },
      approveTime: new Date(),
      name,
    },
  });
  console.log("ok ok", { token, name, user });
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  return await deviceApprove(validatePayload(req.body), verifiedUser);
});

export default APIHandler;
