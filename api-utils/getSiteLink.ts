const dev = process.env.NODE_ENV !== "production";

const SITE_URL = dev ? "http://localhost:3001" : "https://aven.io";

export default function getSiteLink(path: string): string {
  return SITE_URL + path;
}
