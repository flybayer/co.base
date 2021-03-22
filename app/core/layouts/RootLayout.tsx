import { ReactNode, Suspense } from "react"
import { Head } from "blitz"
import styled from "@emotion/styled"
import { css, Global } from "@emotion/react"
import { Spinner } from "@chakra-ui/react"
import { SITE_COLORS } from "../components/SiteConfig"

const MainCSS = css`
  html,
  body,
  div#__next {
    padding: 0;
    margin: 0;
    background: ${SITE_COLORS.BG};
    height: 100%;
  }
`

const Main = styled.main<{ center?: boolean }>`
  position: absolute;
  background: ${SITE_COLORS.BG};
  overflow: hidden;
  min-height: 100%;
  min-width: 100%;
  display: flex;
  justify-content: ${({ center }) => (center ? "center" : "flex-start")};
`

export const ContentDiv = styled.div`
  flex-grow: 4;
`

export const RootLayout = ({
  title,
  children,
  center,
}: {
  title: string
  children: ReactNode
  center?: boolean
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Global styles={MainCSS} />
      <Suspense fallback={<Spinner />}>
        <Main center={center}>{children}</Main>
      </Suspense>
    </>
  )
}
