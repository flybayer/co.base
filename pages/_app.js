import "../styles/globals.css";

import Head from "next/head";

import React from "react";
import { MDXProvider } from "@mdx-js/react";
import Title from "../components/Title";
import { Global } from "@emotion/react";
import prism from "../styles/prism.js";
import { ChakraProvider } from "@chakra-ui/core";

const mdComponents = {
  h1: (props) => <Title {...props} />,
};

function Page({ children, meta }) {
  return (
    <>
      <Head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff"></meta>
      </Head>
      {children}
    </>
  );
}

export default function getMDXPageComponent({ Component, pageProps }) {
  if (Component.renderStandalone) {
    return <Component {...pageProps} />;
  }
  return (
    <Page meta={Component.meta}>
      <Global styles={prism} />
      <ChakraProvider>
        <MDXProvider components={mdComponents}>
          <Component {...pageProps} />
        </MDXProvider>
      </ChakraProvider>
    </Page>
  );
}
