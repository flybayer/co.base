import SiteLayout from "../../lib/components/SiteLayout";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { database } from "../../lib/data/database";
import { LinkButton } from "../../lib/components/Buttons";
import { Error400 } from "../../lib/server/Errors";
import { ReactElement } from "react";

type Comment = {
  id: number;
  publishTime: string;
  message: string;
  user: {
    name: string;
    id: number;
  };
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  const page = context.params?.pageId;
  if (!page) {
    throw new Error400({ message: "No page", name: "NoPage" });
  }
  const comments = await database.comment.findMany({
    where: { page: String(page) },
    include: {
      user: {
        select: { name: true },
      },
    },
  });
  return {
    props: {
      comments: comments.map((c: any) => ({
        ...c,
        publishTime: c.publishTime.toISOString(),
      })),
      user: verifiedUser,
    },
  };
};

export default function CommentPage({ comments, user }: { comments: Comment[]; user: APIUser }): ReactElement {
  const router = useRouter();
  const { pageId } = router.query;

  return (
    <SiteLayout
      content={
        <>
          <h2>Comments on {pageId}</h2>
          {comments.map((comment: Comment) => {
            return (
              <div key={comment.id}>
                <p>
                  <strong>{comment.user.name}</strong> {comment.publishTime}
                </p>
                <p>{comment.message}</p>
                <hr />
              </div>
            );
          })}
          <LinkButton href={`/${pageId}/new-comment`}>New Comment</LinkButton>
        </>
      }
    />
  );
}
