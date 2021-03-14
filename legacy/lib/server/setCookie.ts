import { setCookie as setNookie } from "nookies";

export default function setCookie(res: any, cookieName: string, value: string): void {
  setNookie({ res }, cookieName, value, {
    maxAge: 30 * 24 * 60 * 60, //30d
    path: "/",
  });
}
