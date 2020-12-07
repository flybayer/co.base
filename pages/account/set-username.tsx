import { GetServerSideProps, GetServerSidePropsContext } from "next";
import redirect from "../../api-utils/redirect";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import SiteLayout from "../../components/SiteLayout";
import { useForm } from "react-hook-form";
import ControlledInput from "../../components/ControlledInput";
import React from "react";
import Router from "next/router";
import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";
import { api } from "../../api-utils/api";

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

function ChangeUsernameForm({ username }: { username: string | null }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorText, setErrorText] = React.useState<null | string>(null);
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      username,
    },
  });
  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          api("account-set-username", {
            username: data.username,
          })
            .then((resp) => {
              setIsSubmitting(false);
              if (resp.error) {
                setErrorText(resp.error.message);
              } else {
                Router.push("/account");
              }
            })
            .catch((err) => {
              console.error(err);
              setIsSubmitting(false);
            });
        })}
      >
        <FormControl>
          <FormLabel htmlFor="username-input">Login username</FormLabel>
          <ControlledInput name="username" placeholder="jane-doe" id="username-input" control={control} />
        </FormControl>
        {errorText && <p style={{ color: "#a66" }}>{errorText}</p>}
        <Button type="submit">Set Username</Button>
        {isSubmitting && <Spinner size="sm" />}
      </form>
    </>
  );
}

export default function setNamePage({ user }: { user: APIUser }) {
  return (
    <SiteLayout
      content={
        <>
          <h3>Set Public Username</h3>
          <ChangeUsernameForm username={user.username} />
        </>
      }
    />
  );
}
