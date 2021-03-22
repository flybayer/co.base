import styled from "@emotion/styled"
import { ReactNode } from "react"
import { RootLayout } from "./RootLayout"

const Content = styled.div`
  max-width: 580px;
  box-shadow: 0px 0px 6px #0005;
  padding: 20px 40px;
`

export const HomeLayout = ({ title, children }: { title: string; children: ReactNode }) => {
  return (
    <RootLayout title={title} center>
      <Content>{children}</Content>
    </RootLayout>
  )
}
