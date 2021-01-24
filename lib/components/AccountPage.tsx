import { BasicSiteLayout } from "./SiteLayout";
import { APIUser } from "../server/getVerifedUser";
import { ReactElement } from "react";
import styled from "@emotion/styled";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { SidebarPage } from "./Sidebar";
import { HeaderLink, TitleContainer } from "./Header";
import { LogOutButton } from "./LogOutButton";

export type AccountTab = "index" | "billing" | "auth" | "profile" | "devices";

const AccountPageLinks: Array<{ href: string; key: AccountTab; label: string; icon: IconName }> = [
  { key: "index", href: "/account", label: "My Sites", icon: "home" },
  { key: "billing", href: "/account/billing", label: "Billing", icon: "envelope-open-dollar" },
  { key: "auth", href: "/account/auth", label: "Authentication", icon: "lock" },
  { key: "profile", href: "/account/profile", label: "Profile", icon: "id-badge" },
  { key: "devices", href: "/account/devices", label: "Devices & Logins", icon: "phone-laptop" },
];

const MainSection = styled.div`
  flex-grow: 1;
`;

export function AccountPage({
  children,
  tab,
  user,
}: React.PropsWithChildren<{
  user: APIUser;
  tab: AccountTab;
}>): ReactElement {
  return (
    <BasicSiteLayout
      title="Your Account"
      user={user}
      isDashboard
      content={
        <>
          <TitleContainer>
            <HeaderLink href={`/account`} label={user.username} icon={"user"} />
          </TitleContainer>
          <SidebarPage links={AccountPageLinks} tab={tab} footer={<LogOutButton />}>
            <MainSection>{children}</MainSection>
          </SidebarPage>
        </>
      }
    />
  );
}
