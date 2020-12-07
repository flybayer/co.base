import useCloudClient from './useCloudClient';

export default function useCloud() {
  const cloudClient = useCloudClient();
  if (!cloudClient) {
    throw new Error('No Cloud Client found in context!');
  }
  // todo check cloudClient.type to determine if we should call getCloud
  return cloudClient.getCloud ? cloudClient.getCloud() : cloudClient; // hacky temp.. should always .getCloud on a real client..
}
