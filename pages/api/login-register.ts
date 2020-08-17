import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { sendEmail } from "../../data/email";
import { User } from "@prisma/client";

function getRandomLetters(size: number): string {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < size; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
type Email = string;

export type LoginRegisterPayload = {
  email: Email;
};

function getTempUsername(): string {
  return `u-${getRandomLetters(8)}`;
}

async function findTempUsername() {
  const username = getTempUsername();
  const existingUser = await database.user.findOne({ where: { username } });
  if (existingUser) {
    return await findTempUsername();
  } else {
    return username;
  }
}

function getSiteLink(path) {
  return "http://localhost:3001" + path;
}

function validatePayload(input: any): LoginRegisterPayload {
  if (!input) throw new Error("Request body not provided.");
  const { email } = input;
  if (typeof email !== "string")
    throw new Error('"email" string not provided in request body.');
  if (!/\S+@\S+\.\S+/.test(email))
    throw new Error('"email" string does not look right.');
  return { email };
}

async function login(user: User, email: Email) {
  console.log("Login flow coming..", user, email);
  return { a: 1 };
}

async function register(email: Email) {
  const username = await findTempUsername();
  await sendEmail(
    email,
    "Welcome to Aven",
    `
Hello and welcome!

Click this link to get started: ${getSiteLink(`/api/email-auth?token=123`)}
`
  );
  await database.user.create({ data: { email, username, name: "" } });
  return { a: 2 };
}

async function loginRegister({ email }: LoginRegisterPayload) {
  const existingUser = await database.user.findOne({
    where: { email },
  });
  if (existingUser) {
    return await login(existingUser, email);
  } else {
    return await register(email);
  }
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  const payload = validatePayload(req.body);
  loginRegister(payload)
    .then((resp) => {
      res.statusCode = 200;
      res.send(resp);
    })
    .catch((err) => {
      console.error(err);
      res.statusCode = 500;
      res.send({});
    });
};
