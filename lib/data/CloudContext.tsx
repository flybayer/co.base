import { createContext, ReactElement, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { createClient, AvenClient } from "../../packages/client/src/CloudClient";

export const CloudContext = createContext<null | AvenClient<any>>(null);

export function useCloudClient(): null | AvenClient<any> {
  return useContext(CloudContext);
}

export function useCloudClientIsConnected(): boolean {
  const client = useCloudClient();
  if (!client) return false;
  const [isConn, setIsConn] = useState(client.isConnected());
  useEffect(() => client.onIsConnected(setIsConn), [client]);
  return isConn;
}

export function SiteProvider({ children, siteName }: { children: ReactNode; siteName: string }): ReactElement {
  const connectionHost = global.window?.location?.host;
  const connectionUseSSL = global.window?.location?.protocol === "https:";
  const client = useMemo(() => createClient({ siteName, siteToken: undefined, connectionHost, connectionUseSSL }), [
    siteName,
  ]);
  useEffect(() => {
    client.open();
    return () => {
      client.close();
    };
  });
  return <CloudContext.Provider value={client}>{children}</CloudContext.Provider>;
}
