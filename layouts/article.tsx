import { GetServerSideProps, GetStaticProps } from "next";
import React, { ReactNode } from "react";
import SiteLayout from "../components/SiteLayout";
import { FrontMatter } from "../data/frontMatter";
import VideoLayout from "./video";
import SiteHead from "../components/SiteHead";
import VideoSection from "../components/VideoSection";

function Commenting({ comments, page }: { comments: Comment[]; page: string }) {
  return <h2>comments{JSON.stringify(comments)}</h2>;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const page: string = (context.req as any).path;

  return { props: { comments: [], page } };
};

export const getStaticProps: GetStaticProps = async (context) => {
  return { props: { foo: "bar" } };
};

export default function ArticleLayout({
  children,
  frontMatter,
  page,
  comments,
  ...restProps
}: React.PropsWithChildren<{
  frontMatter: FrontMatter;
  page: string;
  comments: Comment[];
}>) {
  let topContent: ReactNode = null;
  if (frontMatter.vimeoId) {
    topContent = <VideoSection videoTitle={frontMatter.videoTitle} vimeoId={frontMatter.vimeoId} />;
  }
  return (
    <>
      <SiteHead frontMatter={frontMatter} />
      <SiteLayout
        topContent={topContent}
        content={children}
        tailContent={<Commenting comments={comments} page={page} />}
      />
    </>
  );
}
