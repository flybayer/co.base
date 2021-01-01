import { BasicSiteLayout } from "./SiteLayout";
import { APIUser } from "../server/getVerifedUser";
import { PropsWithChildren, ReactElement } from "react";
import styled from "@emotion/styled";
import Link from "next/link";

export type AccountTab = "index" | "billing" | "auth" | "profile" | "devices";

const AccountPageTabs: Array<{ href: string; key: AccountTab; label: string }> = [
  { key: "index", href: "/account", label: "Home" },
  { key: "billing", href: "/account/billing", label: "Billing" },
  { key: "auth", href: "/account/auth", label: "Emails / Auth" },
  { key: "profile", href: "/account/profile", label: "Public Profile" },
  { key: "devices", href: "/account/devices", label: "Devices & Logins" },
];

const SidebarPage = styled.div`
  display: flex;
`;
const Sidebar = styled.div`
  padding: 10px;
  margin: 16px 0 0;
  min-width: 200px;
`;
const MainSection = styled.div`
  flex-grow: 1;
`;
const LinkBox = styled.a`
  display: block;
  padding: 16px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  color: #555;
  :hover {
    color: #000;
  }
  &.active {
    color: blue;
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
            {AccountPageTabs.map(({ key, href, label }) => (
              <SidebarLink key={key} isActive={tab === key} href={href}>
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
