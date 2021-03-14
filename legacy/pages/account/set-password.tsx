import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { BasicSiteLayout } from "../../lib/components/SiteLayout";
import { EmptyObject, useForm } from "react-hook-form";
import ControlledInput from "../../lib/components/ControlledInput";
import React, { ReactElement } from "react";
import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";
import { api } from "../../lib/server/api";
import { handleAsync } from "../../lib/data/handleAsync";
import { useRouter } from "next/router";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
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
  const { push } = useRouter();
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
          handleAsync(
            api("account-set-password", {
              password: data.password,
            }),
            () => {
              push("/account");
            },
          ).finally(() => setIsSubmitting(false));
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

export default function setNamePage({ user }: { user: APIUser }): ReactElement {
  return (
    <BasicSiteLayout
      user={user}
      isDashboard
      content={
        <>
          <h3>Set Password</h3>
          <ChangePasswordForm />
        </>
      }
    />
  );
}
