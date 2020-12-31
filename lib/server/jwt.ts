import { encode as jwtEncode, decode as jwtDecode } from "jwt-simple";

const jwtSecret = process.env.JWT_SECRET as string;

type AvenJWT = {
  sub: number;
  iat: number;
  exp: number;
  username: string;
  revalidateToken?: string;
  revalidateIP?: string;
};

export function encode(payload: AvenJWT): string {
  return jwtEncode(payload, jwtSecret);
}

export function freshJwt(): { iat: number; exp: number } {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 12; // 12 hours
  return {
    iat,
    exp,
  };
}

export function decode(encodedPayload: string): [AvenJWT | null, AvenJWT | null] {
  if (!encodedPayload || encodedPayload === "") return [null, null];
  try {
    const resp = jwtDecode(encodedPayload, jwtSecret);
    return [resp, null];
  } catch (e) {
    // if we see this message, we know that the signature verification did pass, and that expiry is the only issue. so, we can trust the other info in the expired jwt.
    if (e.message !== "Token expired") return [null, null];
    // see: https://github.com/hokaccha/node-jwt-simple/blob/master/lib/jwt.js#L102
    try {
      const expiredJwt = jwtDecode(encodedPayload, jwtSecret, true);
      return [null, expiredJwt];
    } catch (e) {
      console.error("Jwt parse failed", { encodedPayload, e });
      return [null, null];
    }
  }
}
