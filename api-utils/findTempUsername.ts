import { database } from "../data/database";
import { getRandomLetters } from "./getRandomLetters";

export function getTempUsername(): string {
  return `u-${getRandomLetters(8)}`;
}

export async function findTempUsername(): Promise<string> {
  const username = getTempUsername();
  const existingUser = await database.user.findOne({ where: { username } });
  if (existingUser) {
    return await findTempUsername();
  } else {
    return username;
  }
}
