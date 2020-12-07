import React from "react";
import SiteLayout from "../components/SiteLayout";
import { FrontMatter } from "../data/frontMatter";
import SiteHead from "../components/SiteHead";
import RNCourseHeader from "../components/RNCourseHeader";
import VideoSection from "../components/VideoSection";

export default function BaseLayout({ children, frontMatter }: React.PropsWithChildren<{ frontMatter: FrontMatter }>) {
  return (
    <>
      <SiteHead frontMatter={frontMatter} />
      <SiteLayout
        headContent={null}
        topContent={
          <>
            <RNCourseHeader number={frontMatter.seriesNumber} title={frontMatter.title || "..."} />
            {frontMatter.vimeoId ? <VideoSection vimeoId={frontMatter.vimeoId} videoTitle={frontMatter.title} /> : null}
          </>
        }
        content={children}
      />
    </>
  );
}
