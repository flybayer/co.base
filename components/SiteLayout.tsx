import SiteHeader from "./SiteHeader";
import MainWidth from "./MainWidth";
import SiteFooter from "./SiteFooter";
import styled from "@emotion/styled";
import { ReactNode } from "react";

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

export default function SiteLayout({
  topContent,
  headContent,
  content,
  tailContent,
  bottomContent,
}: {
  topContent?: ReactNode;
  headContent?: ReactNode;
  content: ReactNode;
  tailContent?: ReactNode;
  bottomContent?: ReactNode;
}) {
  return (
    <>
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
}
