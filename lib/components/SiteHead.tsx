import { FrontMatter } from "../data/frontMatter";
import Head from "next/head";
import { ReactElement } from "react";

export default function SiteHead({ frontMatter }: { frontMatter: FrontMatter }): ReactElement {
  return (
    <Head>
      <title>{frontMatter?.title || "Aven Cloud"}</title>
      {frontMatter?.summary && <meta name="description" content={frontMatter?.summary} />}
      {frontMatter?.title && <meta property="og:title" content={frontMatter?.title} />}
      {frontMatter?.summary && <meta name="og:description" content={frontMatter?.summary} />}
    </Head>
  );
}
