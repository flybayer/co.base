import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { createAPI } from "../../api-utils/createAPI";
import { getRandomLetters } from "../../api-utils/getRandomLetters";

export type DeviceLoginPayload = unknown;

export type DeviceLoginResponse = {
  token: string;
};

function validatePayload(input: any): DeviceLoginPayload {
  return { ...input };
}

async function deviceLogin(_: DeviceLoginPayload, res: NextApiResponse): Promise<DeviceLoginResponse> {
  const token = getRandomLetters(20);
  await database.deviceToken.create({
    data: {
      token,
      name: "comingsoon",
    },
  });
  return { token };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  return await deviceLogin(validatePayload(req.body), res);
});

export default APIHandler;
