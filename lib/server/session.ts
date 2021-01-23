import { ServerResponse } from "http";
import { NextApiResponse } from "next";
import { AvenJWT, encode } from "./jwt";
import setCookie from "./setCookie";

export function setAvenSession(res: NextApiResponse | ServerResponse, jwtContent: AvenJWT): void {
  setCookie(res, "AvenSession", encode(jwtContent));
}
