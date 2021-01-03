import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import styled from "@emotion/styled";
import { ReactElement, ReactNode } from "react";
import { articleStyles } from "./styles/article";
import { InnerWidth } from "./CommonViews";
import { APIUser } from "../server/getVerifedUser";
import Head from "next/head";

const MainArea = styled.main`
  flex-grow: 1;
  background-color: #f6f8fa;
`;
const MainContainer = styled.div`
  flex-grow: 1;
  max-width: 950px;
  margin: 0 auto;
  padding-top: 20px;
  padding-bottom: 40px;
  @media only screen and (max-width: 1030px) {
    // padding-left: 40px;
    // padding-right: 40px;
  }
`;
const Article = styled.article`
  ${articleStyles}
`;
const BasicContainer = styled.div`
  flex-grow: 1;
  max-width: 950px;
  margin: 0 auto;
  padding-top: 20px;
  padding-bottom: 40px;
  @media only screen and (max-width: 1030px) {
    // padding-left: 40px;
    // padding-right: 40px;
  }
`;

export function ArticleLayout({ content }: { content: ReactNode }): ReactElement {
  return <SiteLayout content={<Article>{content}</Article>} />;
}

export default function SiteLayout({
  title,
  user,
  topContent,
  headContent,
  content,
  tailContent,
  bottomContent,
  hideFooter = false,
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
          <MainContainer>{content}</MainContainer>
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
  isDashboard,
}: {
  title?: string;
  user?: APIUser;
  topContent?: ReactNode;
  headContent?: ReactNode;
  content: ReactNode;
  tailContent?: ReactNode;
  bottomContent?: ReactNode;
  hideFooter?: boolean;
  isDashboard?: boolean;
}): ReactElement {
  return (
    <>
      <Head>
        <title>{title || "Aven Cloud"}</title>
      </Head>
      <SiteHeader user={user} isDashboard={isDashboard} />
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

const SmallPageTitle = styled.h1`
  font-size: 42px;
  line-height: 46px;
  color: #555;
  margin: 0 0 36px;
`;
const SmallPageContainer = styled.div`
  padding: 24px;
  border-radius: 4px;
  background: white;
  max-width: 400px;
  margin: 0 auto;
`;
export function SmallFormPage({ children, title }: { children: ReactNode; title?: string }): ReactElement {
  return (
    <SmallPageContainer>
      {title && <SmallPageTitle>{title}</SmallPageTitle>}
      {children}
    </SmallPageContainer>
  );
}
