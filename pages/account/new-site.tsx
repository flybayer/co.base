import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { BasicSiteLayout } from "../../lib/components/SiteLayout";
import { EmptyObject, useForm } from "react-hook-form";
import React, { PropsWithChildren, ReactNode, useState } from "react";
import Router from "next/router";
import ControlledInput from "../../lib/components/ControlledInput";
import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";
import { api } from "../../lib/server/api";

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

function CreateSiteForm({}: PropsWithChildren<EmptyObject>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
    },
  });
  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          api("site-create", {
            name: data.name,
          })
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
          <FormLabel htmlFor="name-input">Public Slug</FormLabel>
          <ControlledInput id="name-input" placeholder="mysite" name="name" control={control} />
        </FormControl>
        <Button type="submit">Create</Button>
        {isSubmitting && <Spinner size="sm" />}
      </form>
    </>
  );
}

export default function setNamePage({ user }: { user: APIUser }): ReactNode {
  return (
    <BasicSiteLayout
      user={user}
      content={
        <>
          <h3>Create Site</h3>
          <CreateSiteForm />
        </>
      }
    />
  );
}
