import { DocProvider, useClient, useValue } from "../cloud-docs/client";
import Head from "next/head";
import stores from "../stores";

export function Comments() {
  const client = useClient();
  const doc = client?.pageComments("test-page");
  const value = useValue(doc || null);

  return (
    <>
      <Head>
        <title>Comment Here</title>
      </Head>
      <h1>All comments</h1>
      {value &&
        value.comments.map((comment, i) => (
          <div key={i}>
            <h2>{comment.message}</h2>
          </div>
        ))}
      <button
        onClick={() => {
          doc.actions.postComment({
            message: `Your lucky number is ${Math.floor(Math.random() * 100)}`,
          });
        }}
      >
        Post new Random Number
      </button>
    </>
  );
}

export default function CommentsPage() {
  return (
    <DocProvider stores={stores}>
      <Comments />
    </DocProvider>
  );
}
