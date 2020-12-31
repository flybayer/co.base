import { NextApiRequest } from "next";

export function getSiteToken(req: NextApiRequest): string | undefined {
  const token = req.headers["x-aven-site-token"] ? String(req.headers["x-aven-site-token"]) : undefined;
  return token;
}
