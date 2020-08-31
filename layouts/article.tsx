import { GetServerSideProps } from "next";
import video from "./video";
// import { database } from "../data/database";
import Head from "next/head";
import SiteLayout from "../components/SiteLayout";
import { ReactNode } from "react";

function Commenting({ comments, page }: { comments: Comment[]; page: string }) {
  return <h2>{JSON.stringify(comments)}</h2>;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const page: string = (context.req as any).path;
  console.log("YESS", page);
  // const comments = await database.comment.findMany({
  //   where: { page },
  // });
  const commentGet = await import("../api-utils/commentGet");
  const comments = await commentGet();
  return { props: { comments, page } };
};

export default function layout(frontMatter: any) {
  let headContent: ReactNode = null;
  if (frontMatter.vimeoId) {
    headContent = video(frontMatter);
  }
  return ({
    children,
    comments,
    page,
  }: React.PropsWithChildren<{ page: string; comments: Comment[] }>) => {
    return (
      <>
        <Head>
          <title>{frontMatter?.title || "Aven"}</title>
          {frontMatter?.summary && (
            <meta name="description" content={frontMatter?.summary} />
          )}
          {frontMatter?.title && (
            <meta property="og:title" content={frontMatter?.title} />
          )}
          {frontMatter?.summary && (
            <meta name="og:description" content={frontMatter?.summary} />
          )}
        </Head>
        <SiteLayout
          headContent={headContent}
          content={children}
          tailContent={<Commenting comments={comments} page={page} />}
        />
      </>
    );
  };
}
