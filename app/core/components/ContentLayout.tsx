import styled from "@emotion/styled"
import { PropsWithChildren } from "react"
import { Title } from "./Common"

const ContentContainer = styled.div`
  display: flex;
  justify-content: center;
`
const Content = styled.div`
  flex-grow: 1;
  max-width: 600px;
  padding: 20px;
`

export function ContentLayout({
  title,
  children,
}: PropsWithChildren<{
  title?: string
}>) {
  return (
    <ContentContainer>
      <Content>
        {title && <Title>{title}</Title>}
        {children}
      </Content>
    </ContentContainer>
  )
}
