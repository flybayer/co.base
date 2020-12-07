import React, { useMemo } from 'react';
import { createCloudClient, CloudContext } from '@aven/cloud-core';
import createNativeNetworkSource from './createNativeNetworkSource';

export default function NetworkCloudProvider({
  authority,
  useSSL,
  domain,
  children,
  session,
  onSession,
}) {
  const cloud = useMemo(() => {
    const source = createNativeNetworkSource({
      authority,
      useSSL,
    });
    const cloud = createCloudClient({
      source,
      domain,
      initialSession: session,
      onSession,
    });
    return cloud;
  }, [authority, useSSL, domain, session, onSession]);
  return (
    <CloudContext.Provider value={cloud}>{children}</CloudContext.Provider>
  );
}
