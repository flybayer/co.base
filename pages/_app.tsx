import "../styles/globals.css";
import Head from "next/head";
import React, { ReactElement } from "react";
import { MDXProvider } from "@mdx-js/react";
import Title from "../components/Title";
import { Global } from "@emotion/react";
import prism from "../styles/prism";
import { ChakraProvider, extendTheme } from "@chakra-ui/core";

const mdComponents = {
  h1: Title,
};

function Page({ children }: React.PropsWithChildren<unknown>) {
  return (
    <>
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#eaeaea" />
      </Head>
      {children}
    </>
  );
}
const AvenTheme = extendTheme({
  colors: {
    avenColor: {
      50: "#EBEDFF",
      100: "#BED0F8",
      200: "#90A7F4",
      300: "#637FED",
      400: "#426EE1",
      500: "#3160CE",
      600: "#2B49B0",
      700: "#2C4582",
      800: "#2A3C65",
      900: "#1A2A5D",
    },
  },
});
export default function getMDXPageComponent<PageProps>({
  Component,
  pageProps,
}: {
  Component: React.ComponentType<PageProps>;
  pageProps: PageProps;
}): ReactElement {
  return (
    <Page>
      <Global styles={prism} />
      <ChakraProvider theme={AvenTheme}>
        <MDXProvider components={mdComponents}>
          <Component {...pageProps} />
        </MDXProvider>
      </ChakraProvider>
    </Page>
  );
}
