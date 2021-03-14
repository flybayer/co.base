import { BasicSiteLayout } from "./SiteLayout";
import { APIUser } from "../server/getVerifedUser";
import { ReactElement } from "react";
import styled from "@emotion/styled";
import { SidebarPage } from "./Sidebar";
import { SiteTabs } from "./SiteTabs";

export type SiteSettingsTab = "index" | "tokens" | "access";

const MainSection = styled.div`
  flex-grow: 1;
`;

export function SiteSettingsPage({
  children,
  tab,
  user,
  siteName,
}: React.PropsWithChildren<{
  user: APIUser;
  tab: SiteSettingsTab;
  siteName: string;
}>): ReactElement {
  return (
    <BasicSiteLayout
      title={`${siteName} Settings`}
      user={user}
      isDashboard
      content={
        <>
          <SiteTabs siteName={siteName} tab="settings" />

          <SidebarPage
            links={[
              { key: "index", href: `/s/${siteName}/settings`, label: "Site", icon: "cubes" },
              { key: "access", href: `/s/${siteName}/settings/access`, label: "Access", icon: "lock-alt" },
              { key: "tokens", href: `/s/${siteName}/settings/tokens`, label: "Tokens", icon: "key" },
            ]}
            tab={tab}
          >
            <MainSection>{children}</MainSection>
          </SidebarPage>
        </>
      }
    />
  );
}
