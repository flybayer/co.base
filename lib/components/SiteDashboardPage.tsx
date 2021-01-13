import { ReactElement, ReactNode } from "react";
import { APIUser } from "../server/getVerifedUser";
import { BasicSiteLayout } from "./SiteLayout";
import { SiteProvider, useCloudClientIsConnected } from "../data/CloudContext";
import { Text } from "@chakra-ui/core";

function ConnectionStatus(): ReactElement {
  const isConnected = useCloudClientIsConnected();
  if (isConnected) {
    return <Text>Connected</Text>;
  }
  return <Text>Disconnected</Text>;
}

export function SiteDashboardPage({
  user,
  siteName,
  children,
  title,
}: {
  user: APIUser;
  siteName: string;
  children: ReactNode;
  title?: string;
}): ReactElement {
  return (
    <SiteProvider siteName={siteName}>
      <BasicSiteLayout user={user} isDashboard content={children} title={title} />
      <ConnectionStatus />
    </SiteProvider>
  );
}
