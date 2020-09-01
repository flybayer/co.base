import React from "react";
import SiteLayout from "../components/SiteLayout";
import { FrontMatter } from "../data/frontMatter";
import VideoLayout from "./video";
import SiteHead from "../components/SiteHead";

export default function BaseLayout({
  children,
  frontMatter,
}: React.PropsWithChildren<{ frontMatter: FrontMatter }>) {
  if (frontMatter.vimeoId) {
    return <VideoLayout children={children} frontMatter={frontMatter} />;
  }
  return (
    <>
      <SiteHead frontMatter={frontMatter} />
      <SiteLayout content={children} />
    </>
  );
}
