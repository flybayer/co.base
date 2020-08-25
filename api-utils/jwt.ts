import { encode as jwtEncode, decode as jwtDecode } from "jwt-simple";

const jwtSecret = process.env.JWT_SECRET;

type AvenJWT = {
  sub: number;
};

export function encode(payload: AvenJWT): string {
  return jwtEncode(payload, jwtSecret);
}

export function decode(encodedPayload: string): AvenJWT {
  return jwtDecode(encodedPayload, jwtSecret);
}
