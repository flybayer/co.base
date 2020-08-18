import React, { ReactNode } from "react";
import Head from "next/head";
import SiteLayout from "../components/SiteLayout";

export default function createLayout(
  frontMatter: any,
  {
    topContent,
    headContent,
    tailContent,
    bottomContent,
  }: {
    topContent: ReactNode;
    headContent: ReactNode;
    tailContent: ReactNode;
    bottomContent: ReactNode;
  }
) {
  return ({ children: content }: React.PropsWithChildren<{}>) => {
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
        </Head>
        <SiteLayout
          topContent={topContent}
          headContent={headContent}
          content={content}
          tailContent={tailContent}
          bottomContent={bottomContent}
        />
      </>
    );
  };
}
