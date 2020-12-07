import { GetServerSideProps, GetServerSidePropsContext } from "next";
import redirect from "../../api-utils/redirect";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import SiteLayout from "../../components/SiteLayout";
import { useForm } from "react-hook-form";
import React from "react";
import Router, { useRouter } from "next/router";
import ControlledInput from "../../components/ControlledInput";
import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  if (!verifiedUser) {
    redirect(context.res, "/login");
  }
  return {
    props: {
      user: verifiedUser,
    },
  };
};

function NewCommentForm() {
  const router = useRouter();
  const { pageId } = router.query;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorText, setErrorText] = React.useState<null | string>(null);
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      comment: "",
    },
  });
  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          fetch("/api/comment", {
            method: "post",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: data.comment,
              page: pageId,
            }),
          })
            .then((res) => res.json())
            .then((resp) => {
              setIsSubmitting(false);
              if (resp.error) {
                setErrorText(resp.error.message);
              } else {
                Router.push(`/${pageId}/comment`);
              }
            })
            .catch((err) => {
              console.error(err);
              setIsSubmitting(false);
            });
        })}
      >
        <FormControl>
          <FormLabel htmlFor="comment-input">Comment</FormLabel>
          <ControlledInput id="comment-input" placeholder="please be polite!" name="comment" control={control} />
        </FormControl>
        {errorText && <p style={{ color: "#a66" }}>{errorText}</p>}
        <Button type="submit">Publish Comment</Button>
        {isSubmitting && <Spinner size="sm" />}
      </form>
    </>
  );
}

export default function CommentPage({ user }: { user: APIUser }) {
  const router = useRouter();
  const { pageId } = router.query;

  return (
    <SiteLayout
      content={
        <>
          <h3>
            Comment on {pageId} as {user.name}
          </h3>
          <NewCommentForm />
        </>
      }
    />
  );
}
