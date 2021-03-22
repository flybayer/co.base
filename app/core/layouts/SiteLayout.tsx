import { ReactNode } from "react"
import { LinkSidebar } from "../components/LinkSidebar"
import { OneOf } from "../types"
import { RootLayout, ContentDiv } from "./RootLayout"

const SiteLinks = [
  { key: "data", label: "Data", icon: "📍", url: "/fff" },
  { key: "types", label: "Types", icon: "👤", url: "/fuuu" },
] as const

export const SiteLayout = ({
  title,
  children,
  active,
}: {
  title: string
  active: OneOf<typeof SiteLinks>["key"]
  children: ReactNode
}) => {
  return (
    <RootLayout title={title}>
      <LinkSidebar active={active} links={SiteLinks} />
      <ContentDiv>{children}</ContentDiv>
    </RootLayout>
  )
}
