import React, { ReactElement } from "react";
import { ArticleLayout } from "../components/SiteLayout";
import { FrontMatter } from "../data/frontMatter";
import VideoLayout from "./video";
import SiteHead from "../components/SiteHead";

export default function BaseLayout({
  children,
  frontMatter,
}: React.PropsWithChildren<{ frontMatter: FrontMatter }>): ReactElement {
  if (frontMatter.vimeoId) {
    return <VideoLayout frontMatter={frontMatter}>{children}</VideoLayout>;
  }
  return (
    <>
      <SiteHead frontMatter={frontMatter} />
      <ArticleLayout content={children} />
    </>
  );
}
