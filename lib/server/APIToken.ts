import { NextApiRequest } from "next";

export function getToken(req: NextApiRequest): string | undefined {
  const token = req.headers["x-cloud-token"] ? String(req.headers["x-cloud-token"]) : undefined;
  return token;
}
