import VideoSection from "../components/VideoSection";
import { FrontMatter } from "../data/frontMatter";
import SiteLayout from "../components/SiteLayout";
import SiteHead from "../components/SiteHead";
import { ReactElement } from "react";

export default function VideoLayout({
  frontMatter,
  children,
}: React.PropsWithChildren<{ frontMatter: FrontMatter }>): ReactElement {
  return (
    <>
      <SiteHead frontMatter={frontMatter} />
      <SiteLayout
        content={children}
        topContent={
          frontMatter.vimeoId && <VideoSection vimeoId={frontMatter.vimeoId} videoTitle={frontMatter.title || ""} />
        }
      />
    </>
  );
}
