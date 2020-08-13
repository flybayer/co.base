import React from "react";
import VideoSection from "../components/VideoSection";
import Main from "../components/Main";
import Head from "next/head";

export default function Layout(frontMatter) {
  return ({ children: content }) => {
    const vimeoId = frontMatter?.vimeoId;
    return (
      <>
        <Head>
          <title>{frontMatter?.title || "Aven"}</title>
          {frontMatter?.summary && (
            <meta name="description" content={frontMatter?.summary} />
          )}
          {frontMatter?.title && (
            <meta property="og:title" content={frontMatter?.title} />
          )}
          {frontMatter?.summary && (
            <meta name="og:description" content={frontMatter?.summary} />
          )}
          {/* <meta property="og:image" content="https://comingsoon.jpg" /> */}
          {/* <meta property="og:url" content="" /> */}
          {/* <meta name="twitter:title" content="" />
<meta name="twitter:description" content="" />
<meta name="twitter:image" content="" />
<meta name="twitter:card" content="summary_large_image" /> */}
        </Head>
        <div>
          {vimeoId && <VideoSection vimeoId={vimeoId} />}
          <Main>
            <h1>{frontMatter.title}</h1>
            {content}
          </Main>
        </div>
      </>
    );
  };
}
