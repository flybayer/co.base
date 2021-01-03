import { BasicSiteLayout } from "./SiteLayout";
import { APIUser } from "../server/getVerifedUser";
import { PropsWithChildren, ReactElement } from "react";
import styled from "@emotion/styled";
import Link from "next/link";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { Icon } from "./Icon";

export type AccountTab = "index" | "billing" | "auth" | "profile" | "devices";

const AccountPageTabs: Array<{ href: string; key: AccountTab; label: string; icon: IconName }> = [
  { key: "index", href: "/account", label: "Home", icon: "home" },
  { key: "billing", href: "/account/billing", label: "Billing", icon: "envelope-open-dollar" },
  { key: "auth", href: "/account/auth", label: "Emails / Auth", icon: "mailbox" },
  { key: "profile", href: "/account/profile", label: "Public Profile", icon: "id-badge" },
  { key: "devices", href: "/account/devices", label: "Devices & Logins", icon: "phone-laptop" },
];

const SidebarPage = styled.div`
  display: flex;
`;
const Sidebar = styled.div`
  margin: 0 14px 0 0;
  padding: 8px 0;
  min-width: 200px;
  border-radius: 4px;
  overflow: hidden;
  background: white;
  align-self: flex-start;
`;
const MainSection = styled.div`
  flex-grow: 1;
`;

export const primaryColor = "green";
const LinkBox = styled.a`
  display: block;
  padding: 16px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  color: #555;
  display: flex;
  flex-direction: row;
  :hover {
    color: #000;
  }
  &.active {
    color: ${primaryColor};
  }
`;
function SidebarLink({ href, children, isActive }: PropsWithChildren<{ href: string; isActive: boolean }>) {
  return (
    <Link href={href} passHref>
      <LinkBox className={isActive ? "active" : ""}>{children}</LinkBox>
    </Link>
  );
}
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
        <SidebarPage>
          <Sidebar>
            {AccountPageTabs.map(({ key, href, label, icon }) => (
              <SidebarLink key={key} isActive={tab === key} href={href}>
                <div style={{ paddingRight: 14, width: 32, justifyContent: "center", display: "flex" }}>
                  {icon && <Icon icon={icon} color={tab === key ? primaryColor : "#333"} size="lg" />}
                </div>
                {label}
              </SidebarLink>
            ))}
          </Sidebar>
          <MainSection>{children}</MainSection>
        </SidebarPage>
      }
    />
  );
}
