import "../styles/globals.css";
import Head from "next/head";
import React, { ReactElement } from "react";
import { MDXProvider } from "@mdx-js/react";
import Title from "../components/Title";
import { Global } from "@emotion/react";
import prism from "../styles/prism";
import { ChakraProvider } from "@chakra-ui/core";

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
      <ChakraProvider>
        <MDXProvider components={mdComponents}>
          <Component {...pageProps} />
        </MDXProvider>
      </ChakraProvider>
    </Page>
  );
}
