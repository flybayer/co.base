import { encode as jwtEncode, decode as jwtDecode } from "jwt-simple";

const jwtSecret = process.env.JWT_SECRET as string;

type AvenJWT = {
  sub: number;
};

export function encode(payload: AvenJWT): string {
  return jwtEncode(payload, jwtSecret);
}

export function decode(encodedPayload: string): AvenJWT | null {
  try {
    return jwtDecode(encodedPayload, jwtSecret);
  } catch (e) {
    return null;
  }
}
