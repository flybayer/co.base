import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import styled from "@emotion/styled";
import { ReactElement, ReactNode } from "react";
import { articleStyles } from "../styles/article";
import { InnerWidth } from "./CommonViews";
import { APIUser } from "../api-utils/getVerifedUser";
import Head from "next/head";

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
  ${articleStyles}
`;
const BasicContainer = styled.div`
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

export default function SiteLayout({
  user,
  topContent,
  headContent,
  content,
  tailContent,
  bottomContent,
  hideFooter = false,
}: {
  user?: APIUser;
  topContent?: ReactNode;
  headContent?: ReactNode;
  content: ReactNode;
  tailContent?: ReactNode;
  bottomContent?: ReactNode;
  hideFooter?: boolean;
}): ReactElement {
  return (
    <>
      <SiteHeader user={user} />
      <MainArea>
        {topContent}
        <InnerWidth>
          {headContent}
          <Article>{content}</Article>
          {tailContent}
        </InnerWidth>
        {bottomContent}
      </MainArea>
      {!hideFooter && <SiteFooter />}
    </>
  );
}

export function BasicSiteLayout({
  title,
  user,
  topContent,
  headContent,
  content,
  tailContent,
  bottomContent,
}: {
  title?: string;
  user?: APIUser;
  topContent?: ReactNode;
  headContent?: ReactNode;
  content: ReactNode;
  tailContent?: ReactNode;
  bottomContent?: ReactNode;
  hideFooter?: boolean;
}): ReactElement {
  return (
    <>
      <Head>
        <title>{title || "Aven Cloud"}</title>
      </Head>
      <SiteHeader user={user} />
      <MainArea>
        {topContent}
        <InnerWidth>
          {headContent}
          <BasicContainer>{content}</BasicContainer>
          {tailContent}
        </InnerWidth>
        {bottomContent}
      </MainArea>
    </>
  );
}
