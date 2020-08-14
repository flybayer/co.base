import createLayout from "./createLayout";
import VideoSection from "../components/VideoSection";

export default function videoLayout(frontMatter) {
  return createLayout(frontMatter, {
    topContent: frontMatter.vimeoId && (
      <VideoSection vimeoId={frontMatter.vimeoId} />
    ),
  });
}
