import { database } from "../data/database";
import { Error400, Error500 } from "./Errors";
import { findTempUsername } from "./findTempUsername";
import { AvenJWT, freshJwt } from "./jwt";
import { getRandomLetters } from "./getRandomLetters";

export async function verifyEmail(
  secret: string,
  email: string,
  originIp?: string,
): Promise<{
  verifiedEmail: string;
  jwt: AvenJWT;
  user: {
    email: string | null;
    name: string | null;
    id: string;
    username: string;
  };
  isNewUser: boolean;
}> {
  const userSelectQuery = { name: true, id: true, email: true, username: true };
  const emailValidation = await database.emailValidation.findUnique({
    where: { secret },
    include: { user: { select: userSelectQuery } },
  });
  if (!emailValidation) {
    throw new Error400({ message: "Invalid Token", name: "InvalidToken" });
  }
  await database.emailValidation.delete({
    where: { secret },
  });

  if (email !== emailValidation.email) {
    // not sure how this would happen. in theory the token is sufficient proof and this check is not needed at all
    throw new Error500({ message: "Invalid email", name: "WrongEmail" });
  }
  const { emailTime, user: validatedUser, secret: storedSecret } = emailValidation;
  if (!storedSecret) {
    throw new Error500({
      message: "No validation token to compare",
      name: "NoToken",
    });
  }
  if (!email) {
    throw new Error500({ message: "No email to verify", name: "NoEmail" });
  }
  if (storedSecret !== secret) {
    // this should be caught earlier, but just to be safe:
    throw new Error400({ message: "Invalid Token", name: "InvalidToken" });
  }
  if (Date.now() - 60 * 60 * 1000 > emailTime.getTime()) {
    throw new Error400({ message: "Invalid Time", name: "InvalidToken" });
  }

  const verifiedEmail = await database.verifiedEmail.findUnique({
    where: { email },
    include: { user: { select: userSelectQuery } },
  });

  let user = verifiedEmail?.user;
  let isNewUser = false;

  if (!user) {
    const primaryEmailUser = await database.user.findUnique({
      where: { email },
      select: userSelectQuery,
    });
    if (primaryEmailUser) {
      user = primaryEmailUser;
    }

    if (!user) {
      user = await database.user.create({
        data: {
          username: await findTempUsername(),
          name: "",
          email,
        },
        select: userSelectQuery,
      });
      isNewUser = true;
    }

    await database.verifiedEmail.create({
      data: { email, user: { connect: { id: user.id } } },
    });
  }
  const revalidateToken = getRandomLetters(47);
  await database.deviceToken.create({
    data: {
      token: revalidateToken,
      user: { connect: { id: user.id } },
      approveTime: new Date(),
      requestTime: new Date(),
      originIp,
      type: "web:email",
      name: "fixme: email auth token name",
    },
  });
  const jwt = { sub: user.id, revalidateToken, revalidateIP: originIp, username: user.username, ...freshJwt() };

  return { verifiedEmail: email, jwt, user, isNewUser };
}
