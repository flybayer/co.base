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
  if (!AvenSession) {
    return null;
  }
  let jwt = decode(AvenSession);
  if (!jwt) {
    jwt = req.body?.jwt;
  }
  if (!jwt) {
    return null;
  }
  const verifiedUser = await database.user.findUnique({
    where: { id: jwt.sub },
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
