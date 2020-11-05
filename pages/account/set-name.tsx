import { GetServerSideProps, GetServerSidePropsContext } from "next";
import redirect from "../../api-utils/redirect";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import SiteLayout from "../../components/SiteLayout";
import { useForm } from "react-hook-form";
import React from "react";
import Router from "next/router";
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
        <FormControl>
          <FormLabel htmlFor="name-input">Public Name</FormLabel>
          <ControlledInput
            id="name-input"
            placeholder="Jane Doe"
            name="name"
            control={control}
          />
        </FormControl>
        <Button type="submit">Set Name</Button>
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
          <h3>Set Public Name</h3>
          <ChangeNameForm name={user.name} />
        </>
      }
    />
  );
}
