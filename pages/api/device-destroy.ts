import { NextApiRequest, NextApiResponse } from "next";
import { createAPI } from "../../lib/server/createAPI";
import { database } from "../../lib/data/database";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { Error403 } from "../../lib/server/Errors";

export type DeviceDestroyPayload = {
  token?: string;
  id?: string;
};

export type DeviceDestroyResponse = unknown;

function validatePayload(input: any): DeviceDestroyPayload {
  return { ...input };
}

// this endpoint can be used to
// 1. delete a specific device token, with the token secret
// 2. delete a device token by id, if you are the correct user
// 3. delete all of a user's device tokens, which will reqiure them to log back in within 12 hours

async function deviceDestroy(
  { token, id }: DeviceDestroyPayload,
  user: APIUser | null,
): Promise<DeviceDestroyResponse> {
  if (token) {
    // token is considered a secret. so if they know it, they can destroy it.
    await database.deviceToken.delete({
      where: { token },
    });
    return;
  }
  if (!user) {
    throw new Error403({ name: "NoAuth" });
  }
  if (id) {
    // include user in the query to ensure users cannot delete tokens of another user by guessing ids
    await database.deviceToken.deleteMany({
      where: { user: { id: user.id }, id },
    });
  } else {
    // destroy all devices
    await database.deviceToken.deleteMany({
      where: { user: { id: user.id } },
    });
  }
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  return await deviceDestroy(validatePayload(req.body), verifiedUser);
});

export default APIHandler;
