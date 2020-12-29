import { parseCookies } from "nookies";
import { database } from "../data/database";
import { decode } from "./jwt";

export type APIUser = {
  id: number;
  email: string | null;
  phone: string | null;
  name: string | null;
  username: string;
  hasPassword: boolean;
};

export default async function getVerifiedUser(req: any): Promise<APIUser | null> {
  const cookies = parseCookies({ req });
  const { AvenSession } = cookies;
  const encodedJwt = AvenSession || req.headers["x-aven-jwt"];
  if (!encodedJwt) {
    return null;
  }
  const [verifiedJwt, expiredJwt] = decode(encodedJwt);
  let verifiedUserId: number | null = null;

  if (!verifiedJwt && !expiredJwt) {
    return null;
  } else if (verifiedJwt) {
    verifiedUserId = verifiedJwt.sub;
  } else if (expiredJwt) {
    const { revalidateIP, revalidateToken } = expiredJwt;

    console.log("JWT revalidate workflow!", expiredJwt);
  }
  if (!verifiedUserId) {
    return null;
  }
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
