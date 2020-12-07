import { SiteSchema } from './AvenCloud-Generated';
import { createClient, SiteLoad } from './AvenCloudNPM';

const AvenCloud = createClient<SiteSchema>({
  siteName: 'aven',
  connectionHost: 'localhost:3001',
  connectionUseSSL: false,
});

export default AvenCloud;

export type AvenCloudLoad = SiteLoad<SiteSchema>;
