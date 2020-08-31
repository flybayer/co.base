import createLayout from "./createLayout";
import video from "./video";

export default function layout(frontMatter: any) {
  if (frontMatter.vimeoId) {
    return video(frontMatter);
  }
  return createLayout(frontMatter, {});
}
