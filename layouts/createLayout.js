import React from "react";
import MainWidth from "../components/MainWidth";
import Head from "next/head";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import styled from "@emotion/styled";

const MainArea = styled.main`
  flex-grow: 1;
  background-color: #f6f8fa;
`;
const Article = styled.article`
  flex-grow: 1;
  max-width: 950px;
  margin: 0 auto;
  padding-top: 40px;
  padding-bottom: 40px;
  @media only screen and (max-width: 1030px) {
    padding-left: 40px;
    padding-right: 40px;
  }
`;

export default function createLayout(
  frontMatter,
  { topContent, headContent, tailContent, bottomContent }
) {
  return ({ children: content }) => {
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
        <SiteHeader />
        <MainArea>
          {topContent}
          <MainWidth>
            {headContent}
            <Article>{content}</Article>
            {tailContent}
          </MainWidth>
          {bottomContent}
        </MainArea>
        <SiteFooter />
      </>
    );
  };
}
