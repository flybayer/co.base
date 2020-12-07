import React, { useMemo } from 'react';
import { createClient, CloudContext } from '@aven/cloud-core';
import createNativeNetworkSource from './createNativeNetworkSource';

export default function AuthenticatedNetworkCloudProvider({
  authority,
  useSSL,
  domain,
  children,
  auth,
}) {
  const cloud = useMemo(() => {
    const source = createNativeNetworkSource({
      authority,
      useSSL,
    });
    const cloud = createClient({
      source,
      domain,
      auth,
    });
    return cloud;
  }, [authority, useSSL, domain, auth]);
  return (
    <CloudContext.Provider value={cloud}>{children}</CloudContext.Provider>
  );
}
