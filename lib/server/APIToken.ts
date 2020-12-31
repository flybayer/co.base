import { NextApiRequest } from "next";

export function getToken(req: NextApiRequest): string | undefined {
  const token = req.headers["x-aven-token"] ? String(req.headers["x-aven-token"]) : undefined;
  return token;
}
