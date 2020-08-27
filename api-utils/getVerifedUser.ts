import { GetServerSidePropsContext } from "next";
import { parseCookies } from "nookies";
import { database } from "../data/database";
import { resetSubscription } from "./billing";
import { decode } from "./jwt";
import { Error500 } from "./Errors";

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
  const { AvenSession } = cookies;
  if (!AvenSession) {
    return null;
  }
  const jwt = decode(AvenSession);
  if (!jwt) {
    return null;
  }
  const verifiedUser = await database.user.findOne({
    where: { id: jwt.sub },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      giftedAccess: true,
      subscribedAccess: true,
      passwordSalt: true,
      stripeCustomerId: true,
      subscriptionEndTime: true,
    },
  });
  if (!verifiedUser) {
    return null;
  }

  const hasPassword = !!verifiedUser.passwordSalt;
  const {
    id,
    email,
    name,
    username,
    giftedAccess,
    subscribedAccess,
    stripeCustomerId,
  } = verifiedUser;
  const apiUser = {
    id,
    email,
    name,
    username,
    giftedAccess,
    subscribedAccess,
    hasPassword,
    stripeCustomerId,
  };

  if (
    verifiedUser.subscriptionEndTime &&
    new Date() > verifiedUser.subscriptionEndTime
  ) {
    await resetSubscription(apiUser);
  }

  return apiUser;
}
