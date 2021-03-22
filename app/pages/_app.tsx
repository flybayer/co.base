import {
  AppProps,
  useRouter,
  AuthenticationError,
  AuthorizationError,
  ErrorFallbackProps,
  Head,
} from "blitz"
import { ErrorBoundary } from "react-error-boundary"
import { queryCache } from "react-query"
import LoginForm from "app/auth/components/LoginForm"
import { ChakraProvider, css } from "@chakra-ui/react"
import { Global } from "@emotion/react"
import { ErrorPage } from "app/core/components/ErrorPage"

const globalCSS = css``

export default function App({ Component, pageProps }: AppProps) {
  const getLayout = Component.getLayout || ((page) => page)
  const router = useRouter()

  return (
    <ChakraProvider>
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#9f3dac" />
        <meta name="msapplication-TileColor" content="#9f3dac" />
        <meta name="theme-color" content="#ffffff" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
        @font-face {
    font-family: FiraSans;
    src: url("/font/FiraSans-Bold.otf") format("opentype"),
      url("/font/FiraSans-Bold.woff2") format("woff2");
      font-display: block;
  }
  `,
          }}
        />
      </Head>
      <Global styles={globalCSS} />
      <ErrorBoundary
        FallbackComponent={RootErrorFallback}
        resetKeys={[router.asPath]}
        onReset={() => {
          // This ensures the Blitz useQuery hooks will automatically refetch
          // data any time you reset the error boundary
          queryCache.resetErrorBoundaries()
        }}
      >
        {getLayout(<Component {...pageProps} />)}
      </ErrorBoundary>
    </ChakraProvider>
  )
}

function RootErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  if (error instanceof AuthenticationError) {
    return <LoginForm onSuccess={resetErrorBoundary} />
  } else if (error instanceof AuthorizationError) {
    return (
      <ErrorPage
        statusCode={error.statusCode}
        title="Sorry, you are not authorized to access this"
      />
    )
  } else {
    return <ErrorPage statusCode={error.statusCode || 400} title={error.message || error.name} />
  }
}
