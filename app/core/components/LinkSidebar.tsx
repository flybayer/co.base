import styled from "@emotion/styled"
import Link from "next/link"
import { PropsWithChildren } from "react"
import { OneOf } from "../types"
import { UserSidebarFooter } from "./UserSidebarFooter"

const SidebarNav = styled.nav`
  background: white;
  // border-right: 1px solid #ccc;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 0px 6px #0005;
`
const SidebarNavMainDiv = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`
export function Sidebar({ children }: PropsWithChildren<{}>) {
  return (
    <SidebarNav>
      <SidebarNavMainDiv>{children}</SidebarNavMainDiv>
      <UserSidebarFooter />
    </SidebarNav>
  )
}
const SidebarLinkA = styled.a<{ isActive: boolean }>`
  color: #333;
  text-decoration: none;
  font-family: sans-serif;
  transition: background 2s, border 0.2s;
  background: ${(props) => (props.isActive ? "#f5f7fc" : "#fff")};
  font-weight: ${(props) => (props.isActive ? "bold" : "")};
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  :hover {
    border-top: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    color: #000;
    background: #f0f4ff;
  }
  padding: 8px 12px 8px 42px;
`

const SidebarLinkIcon = styled.span`
  position: absolute;
  left: 14px;
`

export function SidebarLink({
  label,
  icon,
  isActive,
  url,
}: {
  label: string
  icon?: string
  isActive: boolean
  url: string
}) {
  return (
    <Link href={url} passHref>
      <SidebarLinkA isActive={isActive} aria-selected={isActive}>
        <SidebarLinkIcon>{icon}</SidebarLinkIcon>
        {label}
      </SidebarLinkA>
    </Link>
  )
}

type LinkDef = { url: string; label: string; icon: string; key: string }

export function LinkSidebar<Links extends Readonly<LinkDef[]>>({
  links,
  active,
}: {
  links: Links
  active?: OneOf<Links>["key"]
}) {
  return (
    <Sidebar>
      {links.map(({ url, label, icon, key }) => {
        return (
          <SidebarLink key={key} label={label} icon={icon} url={url} isActive={active === key} />
        )
      })}
    </Sidebar>
  )
}
