import { createClient, SiteLoad } from "./AvenCloudNPM";

export type SiteData = {
  "pricing-plans": Array<{
    title: string;
    "price-per-month": number;
    key: string;
  }>;
};

const AvenCloud = createClient<SiteData>({
  siteName: "aven",
  connectionHost: "localhost:3001",
  connectionUseSSL: false,
});

export default AvenCloud;

export type AvenCloudLoad = SiteLoad<SiteData>;
