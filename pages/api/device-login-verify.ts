import { NextApiRequest, NextApiResponse } from "next";
import { createAPI } from "../../api-utils/createAPI";
import { Error400 } from "../../api-utils/Errors";
import { database } from "../../data/database";

export type DeviceLoginVerifyPayload = {
  token: string;
};

export type DeviceLoginVerifyResponse = {
  isApproved: boolean;
  name?: string;
  username?: string;
};

function validatePayload(input: any): DeviceLoginVerifyPayload {
  return { ...input };
}

async function deviceLoginVerify({ token }: DeviceLoginVerifyPayload): Promise<DeviceLoginVerifyResponse> {
  const deviceToken = await database.deviceToken.findUnique({
    where: { token },
    select: {
      approveTime: true,
      name: true,
      user: {
        select: { username: true },
      },
    },
  });
  if (deviceToken && deviceToken.approveTime) {
    return { isApproved: true, name: deviceToken.name, username: deviceToken.user?.username };
  } else if (deviceToken) {
    return { isApproved: false, name: deviceToken.name, username: undefined };
  }
  throw new Error400({ name: "InvalidToken" });
}

const APIHandler = createAPI(async (req: NextApiRequest, _res: NextApiResponse) => {
  return await deviceLoginVerify(validatePayload(req.body));
});

export default APIHandler;
