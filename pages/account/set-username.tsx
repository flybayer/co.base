import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { BasicSiteLayout } from "../../lib/components/SiteLayout";
import { useForm } from "react-hook-form";
import ControlledInput from "../../lib/components/ControlledInput";
import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";
import { api } from "../../lib/server/api";
import { handleAsync } from "../../lib/data/handleAsync";
import { authRedirect } from "../../lib/server/authRedirect";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  if (!verifiedUser) return authRedirect(context);
  return {
    props: {
      user: verifiedUser,
    },
  };
};

function ChangeUsernameForm({ username }: { username: string | null }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorText, setErrorText] = React.useState<null | string>(null);
  const { push } = useRouter();
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
          handleAsync(
            api("account-set-username", {
              username: data.username,
            }),
            () => {
              push("/account");
            },
          ).finally(() => {
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

export default function setNamePage({ user }: { user: APIUser }): ReactElement {
  return (
    <BasicSiteLayout
      user={user}
      content={
        <>
          <h3>Set Public Username</h3>
          <ChangeUsernameForm username={user.username} />
        </>
      }
    />
  );
}
