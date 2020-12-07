import React, { useMemo } from 'react';
import { createCloudClient } from '@aven/cloud-core';
import createBrowserNetworkSource from './createBrowserNetworkSource';
import { CloudContext } from '@aven/cloud-core';

export default function NetworkCloudProvider({
  authority,
  useSSL,
  domain,
  children,
  session,
  onSession,
}) {
  const cloud = useMemo(() => {
    const source = createBrowserNetworkSource({
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
