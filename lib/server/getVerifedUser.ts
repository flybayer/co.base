import { IncomingMessage, ServerResponse } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { parseCookies } from "nookies";
import { database } from "../data/database";
import { getOriginIp } from "./getOriginIp";
import { decode, encode, freshJwt } from "./jwt";
import setCookie from "./setCookie";

export type APIUser = {
  id: number;
  email: string | null;
  phone: string | null;
  name: string | null;
  username: string;
  hasPassword: boolean;
};

export default async function getVerifiedUser(
  req: NextApiRequest | IncomingMessage,
  res: NextApiResponse | ServerResponse,
): Promise<APIUser | null> {
  const cookies = parseCookies({ req });
  const { AvenSession } = cookies;
  const encodedJwt = AvenSession || req.headers["x-aven-jwt"];

  const userDeviceToken = req.headers["x-aven-user-token"] && String(req.headers["x-aven-user-token"]);

  if (!encodedJwt) {
    return null;
  }
  const [verifiedJwt, expiredJwt] = decode(String(encodedJwt));
  let verifiedUserId: number | null = null;

  if (verifiedJwt) {
    verifiedUserId = verifiedJwt.sub;
  } else if (expiredJwt) {
    const { revalidateIP, revalidateToken } = expiredJwt;
    if (getOriginIp(req) !== revalidateIP) {
      return null;
    }
    const deviceToken = await database.deviceToken.findFirst({
      where: {
        user: { id: expiredJwt.sub },
        token: revalidateToken,
        approveTime: { not: null },
      },
    });
    if (!deviceToken) {
      return null;
    }
    verifiedUserId = expiredJwt.sub;
    const jwt = encode({
      ...expiredJwt,
      ...freshJwt(),
    });
    setCookie(res, "AvenSession", jwt);
  } else if (userDeviceToken) {
    const deviceToken = await database.deviceToken.findFirst({
      where: {
        token: userDeviceToken,
        approveTime: { not: null },
      },
      select: {
        user: {
          select: { id: true },
        },
      },
    });
    if (deviceToken?.user) {
      verifiedUserId = deviceToken.user.id;
    }
  }
  if (!verifiedUserId) {
    return null;
  }
  // todo: to improve perf, do not perform a db query here. Query for data elsewhere, or store email/username in the JWT, updating it after changes.
  const verifiedUser = await database.user.findUnique({
    where: { id: verifiedUserId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      username: true,
      passwordHash: true,
    },
  });
  if (!verifiedUser) {
    return null;
  }

  const hasPassword = !!verifiedUser.passwordHash;
  const { id, email, phone, name, username } = verifiedUser;
  const apiUser = {
    id,
    email,
    phone,
    name,
    username,
    hasPassword,
  };

  return apiUser;
}
