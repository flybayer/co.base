import { useCloudClient, useStream } from '@aven/cloud';

export default function AuthSwitch({ loggedIn, loggedOut }) {
  const client = useCloudClient();
  const clientState = useStream(client.clientState);
  console.log('ummm CSS', clientState);
  if (clientState?.session) {
    return loggedIn;
  }
  return loggedOut;
}
