import React from "react";
import MainWidth from "../components/MainWidth";
import Head from "next/head";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import styled from "@emotion/styled";
import { Global, css } from "@emotion/react";

const MainArea = styled.main`
  flex-grow: 1;
  background-color: #f6f8fa;
`;
const Article = styled.article`
  flex-grow: 1;
  max-width: 950px;
  margin: 0 auto;
  padding-bottom: 40px;
  @media only screen and (max-width: 990px) {
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
        <Global
          styles={css`
            html,
            body {
              height: 100%;
            }
            body {
              display: flex;
              flex-direction: column;
              align-items: stretch;
            }
            #__next {
              display: flex;
              flex-grow: 1;
              background: green;
              align-self: stretch;
              flex-direction: column;
            }
            @font-face {
              font-family: "Young Serif";
              font-style: normal;
              font-weight: 400;
              font-display: swap;
              src: local("Young Serif Regular"), local("YoungSerif-Regular"),
                url("/font/YoungSerif-Regular.otf") format("otf");
            }
            @font-face {
              font-family: "Fira Sans";
              font-style: normal;
              font-weight: 700;
              font-display: swap;
              src: local("Fira Sans Bold"), local("FiraSans-Bold"),
                url("/font/FiraSans-Bold.woff2") format("woff2");
            }
            @font-face {
              font-family: "Fira Sans";
              font-style: italic;
              font-weight: 700;
              font-display: swap;
              src: local("Fira Sans BoldItalic"), local("FiraSans-BoldItalic"),
                url("/font/FiraSans-BoldItalic.woff2") format("woff2");
            }
            @font-face {
              font-family: "Fira Sans";
              font-style: italic;
              font-weight: 400;
              font-display: swap;
              src: local("Fira Sans Italic"), local("FiraSans-Italic"),
                url("/font/FiraSans-Italic.woff2") format("woff2");
            }
            @font-face {
              font-family: "Fira Sans";
              font-style: normal;
              font-weight: 400;
              font-display: swap;
              src: local("Fira Sans Regular"), local("FiraSans-Regular"),
                url("/font/FiraSans-Regular.woff2") format("woff2");
            }
            hr {
              margin: 40px 0;
              border-top: 1px dashed #556678;
              border-bottom: none;
            }
            h1 {
              color: #374453;
              font-family: "Young Serif";
              font-size: 64px;
              margin: 60px 0 10px;
            }
            h2 {
              color: #556678;
              font-size: 48px;
              font-family: "Young Serif";
              margin: 48px 0 10px;
            }
            h3 {
              color: #374453;
              font-size: 32px;
              font-family: "Fira Sans";
              margin: 32px 0 10px;
            }
            h4 {
              color: #556678;
              font-size: 28px;
              font-family: "Fira Sans";
              margin: 26px 0 10px;
            }
            p {
              color: #374453;
              font-size: 18px;
              margin: 10px 0 10px;
            }
            li {
              color: #374453;
              margin: 12px 0 0 0;
              font-size: 18px;
            }
            a {
              color: #374453;
              text-decoration: none;
              border-bottom: 4px solid #abc0c7;
              text-shadow: none;
              transition: background-color 0.45s ease-out, border 0.45s ease-out;
              overflow-wrap: break-word;
              word-break: break-word;
              word-wrap: break-word;
              position: relative;
            }
            a:hover {
              transition: background-color 0.25s ease-out, border 0.25s ease-out;
              background-color: rgba(171, 192, 199, 0.75);
              text-shadow: none;
              border-bottom-color: transparent;
              text-decoration: none;
            }
          `}
        />
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
