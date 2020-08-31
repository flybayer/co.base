import { GetServerSideProps, GetServerSidePropsContext } from "next";
import redirect from "../../api-utils/redirect";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import SiteLayout from "../../components/SiteLayout";
import { useForm } from "react-hook-form";
import { FormGroup, Spinner } from "@blueprintjs/core";
import { ControlledInputGroup } from "../../components/ControlledInputGroup";
import React from "react";
import Router from "next/router";

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

function ChangeNameForm({ name }: { name: string | null }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      name,
    },
  });
  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          fetch("/api/account-set-public", {
            method: "post",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: data.name,
            }),
          })
            .then((res) => res.json())
            .then((resp) => {
              setIsSubmitting(false);
              Router.push("/account");
            })
            .catch((err) => {
              console.error(err);
              setIsSubmitting(false);
            });
        })}
      >
        <FormGroup label="Public Name" labelFor="name-input">
          <ControlledInputGroup
            id="name-input"
            placeholder="Jane Doe"
            name="name"
            control={control}
          />
        </FormGroup>
        <button type="submit" className="bp3-button bp3-intent-primary">
          <span className="bp3-button-text">Set Name</span>
        </button>
        {isSubmitting && <Spinner size={Spinner.SIZE_SMALL} />}
      </form>
    </>
  );
}

export default function setNamePage({ user }: { user: APIUser }) {
  return (
    <SiteLayout
      content={
        <>
          <h3>Set Public Name</h3>
          <ChangeNameForm name={user.name} />
        </>
      }
    />
  );
}
