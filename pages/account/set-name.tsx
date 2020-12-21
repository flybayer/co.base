import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { BasicSiteLayout } from "../../components/SiteLayout";
import { useForm } from "react-hook-form";
import React, { ReactElement } from "react";
import Router from "next/router";
import ControlledInput from "../../components/ControlledInput";
import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";
import { api } from "../../api-utils/api";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  if (!verifiedUser) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
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
          api("/api/account-set-public", {
            name: data.name,
          })
            .then(() => {
              setIsSubmitting(false);
              Router.push("/account");
            })
            .catch((err) => {
              console.error(err);
              setIsSubmitting(false);
            });
        })}
      >
        <FormControl>
          <FormLabel htmlFor="name-input">Public Name</FormLabel>
          <ControlledInput id="name-input" placeholder="Jane Doe" name="name" control={control} />
        </FormControl>
        <Button type="submit">Set Name</Button>
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
          <h3>Set Public Name</h3>
          <ChangeNameForm name={user.name} />
        </>
      }
    />
  );
}
