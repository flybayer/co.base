import VideoSection from "../components/VideoSection";
import { FrontMatter } from "../data/frontMatter";
import SiteLayout from "../components/SiteLayout";
import SiteHead from "../components/SiteHead";

export default function VideoLayout({ frontMatter, children }: React.PropsWithChildren<{ frontMatter: FrontMatter }>) {
  return (
    <>
      <SiteHead frontMatter={frontMatter} />
      <SiteLayout
        content={children}
        topContent={<VideoSection vimeoId={frontMatter.vimeoId} videoTitle={frontMatter.title} />}
      />
    </>
  );
}
