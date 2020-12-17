import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { Error400 } from "../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { createAPI } from "../../api-utils/createAPI";
import { getRandomLetters } from "../../api-utils/getRandomLetters";

export type DeviceLoginVerifyPayload = {
  token: string;
};

export type DeviceLoginVerifyResponse = {
  token: string;
};

function validatePayload(input: any): DeviceLoginVerifyPayload {
  return { ...input };
}

async function deviceLoginVerify(
  { token }: DeviceLoginVerifyPayload,
  res: NextApiResponse,
): Promise<DeviceLoginVerifyResponse> {
  // await database.deviceToken.create({
  //   data: {
  //     token,
  //   },
  // });
  return { token };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  return await deviceLoginVerify(validatePayload(req.body), res);
});

export default APIHandler;
