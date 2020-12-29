import { NextApiRequest, NextApiResponse } from "next";
import { createAPI } from "../../api-utils/createAPI";
import { database } from "../../data/database";

export type DeviceDestroyPayload = {
  token: string;
};

export type DeviceDestroyResponse = unknown;

function validatePayload(input: any): DeviceDestroyPayload {
  return { ...input };
}

async function deviceDestroy({ token }: DeviceDestroyPayload): Promise<DeviceDestroyResponse> {
  await database.deviceToken.delete({
    where: { token },
  });
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, _res: NextApiResponse) => {
  return await deviceDestroy(validatePayload(req.body));
});

export default APIHandler;
