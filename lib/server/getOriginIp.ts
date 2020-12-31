import { IncomingMessage } from "http";
import { NextApiRequest } from "next";

export function getOriginIp(req: NextApiRequest | IncomingMessage): string | undefined {
  return req.headers["x-forwarded-for"] && String(req.headers["x-forwarded-for"]);
}
