import SiteLayout from "../../components/SiteLayout";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { database } from "../../data/database";
import PostButton from "../../components/PostButton";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  const page: string = (context.params as any).pageId;
  const comments = await database.comment.findMany({
    where: { page },
    include: {
      user: {
        select: { name: true },
      },
    },
  });
  return {
    props: {
      comments: comments.map((c) => ({
        ...c,
        publishTime: c.publishTime.toISOString(),
      })),
      user: verifiedUser,
    },
  };
};

export default function CommentPage({
  comments,
  user,
}: {
  comments: any;
  user: APIUser;
}) {
  const router = useRouter();
  const { pageId } = router.query;

  return (
    <SiteLayout
      content={
        <>
          <h2>Comments on {pageId}</h2>
          {comments.map((comment: any) => {
            return (
              <div>
                <p>
                  <strong>{comment.user.name}</strong> {comment.publishTime}
                </p>
                <p>{comment.message}</p>
                <hr />
              </div>
            );
          })}
          <PostButton method="GET" action={`/${pageId}/new-comment`}>
            New Comment
          </PostButton>
        </>
      }
    />
  );
}
