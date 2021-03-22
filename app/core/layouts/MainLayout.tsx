import { ReactNode } from "react"
import { LinkSidebar } from "../components/LinkSidebar"
import { OneOf } from "../types"
import { RootLayout, ContentDiv } from "./RootLayout"

const HomeLinks = [
  { key: "sites", label: "Sites", icon: "📍", url: "/sites" },
  { key: "profile", label: "Profile", icon: "👤", url: "/profile" },
  { key: "docs", label: "Docs", icon: "👾", url: "/docs" },
  { key: "support", label: "Support", icon: "🙌", url: "/support" },
  { key: "prices", label: "Prices + Billing", icon: "💼", url: "/billing" },
] as const

export const MainLayout = ({
  title,
  children,
  active,
}: {
  title: string
  children: ReactNode
  active?: OneOf<typeof HomeLinks>["key"]
}) => {
  return (
    <RootLayout title={title}>
      <LinkSidebar active={active} links={HomeLinks} />
      <ContentDiv>{children}</ContentDiv>
    </RootLayout>
  )
}
