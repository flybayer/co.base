import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { createAPI } from "../../lib/server/createAPI";
import { getRandomLetters } from "../../lib/server/getRandomLetters";

export type DeviceLoginPayload = unknown;

export type DeviceLoginResponse = {
  token: string;
};

function validatePayload(input: any): DeviceLoginPayload {
  return { ...input };
}

async function deviceLogin(_: DeviceLoginPayload, res: NextApiResponse): Promise<DeviceLoginResponse> {
  const token = getRandomLetters(47);
  await database.deviceToken.create({
    data: {
      token,
      name: "comingsoon",
      type: "device",
    },
  });
  return { token };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  return await deviceLogin(validatePayload(req.body), res);
});

export default APIHandler;
