import { PropsWithChildren, ReactElement, ReactNode } from "react";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { Icon } from "./Icon";
import Link from "next/link";
import styled from "@emotion/styled";
import { primaryColor } from "../../pages/_app";

const SidebarPageContainer = styled.div`
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

export type SidebarLink = { icon: IconName; label: string; href: string; key: string };

export function SidebarPage({
  children,
  links,
  tab,
  footer,
}: {
  children: ReactNode;
  links: SidebarLink[];
  tab: string;
  footer?: ReactNode;
}): ReactElement {
  return (
    <SidebarPageContainer>
      <Sidebar>
        {links.map(({ key, href, label, icon }) => (
          <SidebarLink key={key} isActive={tab === key} href={href}>
            <div style={{ paddingRight: 14, width: 32, justifyContent: "center", display: "flex" }}>
              {icon && <Icon icon={icon} color={tab === key ? primaryColor : "#333"} size="lg" />}
            </div>
            {label}
          </SidebarLink>
        ))}
        {footer}
      </Sidebar>
      {children}
    </SidebarPageContainer>
  );
}
