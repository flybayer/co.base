import { GetServerSideProps, GetServerSidePropsContext } from "next";
import redirect from "../../api-utils/redirect";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import SiteLayout, { BasicSiteLayout } from "../../components/SiteLayout";
import { EmptyObject, useForm } from "react-hook-form";
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

function ChangePasswordForm({}: EmptyObject) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorText, setErrorText] = React.useState<null | string>(null);
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      password: "",
    },
  });
  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          api("account-set-password", {
            password: data.password,
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
          <FormLabel htmlFor="password-input">Login password</FormLabel>
          <ControlledInput name="password" placeholder="" type="password" id="password-input" control={control} />
        </FormControl>
        {errorText && <p style={{ color: "#a66" }}>{errorText}</p>}
        <Button type="submit">Set PW</Button>
        {isSubmitting && <Spinner size="sm" />}
      </form>
    </>
  );
}

export default function setNamePage({ user }: { user: APIUser }) {
  return (
    <BasicSiteLayout
      user={user}
      content={
        <>
          <h3>Set Password</h3>
          <ChangePasswordForm />
        </>
      }
    />
  );
}
