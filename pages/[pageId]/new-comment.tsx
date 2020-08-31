import { GetServerSideProps, GetServerSidePropsContext } from "next";
import redirect from "../../api-utils/redirect";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import SiteLayout from "../../components/SiteLayout";
import { useForm } from "react-hook-form";
import { FormGroup, Spinner } from "@blueprintjs/core";
import { ControlledInputGroup } from "../../components/ControlledInputGroup";
import React from "react";
import Router, { useRouter } from "next/router";

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
        <FormGroup label="Comment" labelFor="comment-input">
          <ControlledInputGroup
            id="comment-input"
            placeholder="please be polite!"
            name="comment"
            control={control}
          />
        </FormGroup>
        {errorText && <p style={{ color: "#a66" }}>{errorText}</p>}
        <button type="submit" className="bp3-button bp3-intent-primary">
          <span className="bp3-button-text">Publish Comment</span>
        </button>
        {isSubmitting && <Spinner size={Spinner.SIZE_SMALL} />}
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
