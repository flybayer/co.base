import { GetServerSidePropsContext } from "next";
import { parseCookies } from "nookies";
import { database } from "../data/database";

export type APIUser = {
  id: number;
  email: string;
  name: string | null;
  username: string;
  giftedAccess: number;
  subscribedAccess: number;
  hasPassword: boolean;
  stripeCustomerId: string | null;
};

export default async function getVerifiedUser(
  req: any
): Promise<APIUser | null> {
  const cookies = parseCookies({ req });
  const { AvenSessionToken } = cookies;
  if (!AvenSessionToken) {
    return null;
  }
  const session = await database.session.findOne({
    where: { token: AvenSessionToken },
    select: {
      verifiedUser: {
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          giftedAccess: true,
          subscribedAccess: true,
          passwordSalt: true,
          stripeCustomerId: true,
        },
      },
    },
  });
  if (!session?.verifiedUser) {
    return null;
  }
  const hasPassword = !!session.verifiedUser.passwordSalt;
  const {
    id,
    email,
    name,
    username,
    giftedAccess,
    subscribedAccess,
    stripeCustomerId,
  } = session.verifiedUser;
  return {
    id,
    email,
    name,
    username,
    giftedAccess,
    subscribedAccess,
    hasPassword,
    stripeCustomerId,
  };
}
