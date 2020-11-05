import Head from "next/head";
import Link from "next/link";
import { useForm } from "react-hook-form";
import SiteLayout from "../../components/SiteLayout";
import { GetServerSideProps } from "next";
import React from "react";
import redirect from "../../api-utils/redirect";
import getVerifiedUser from "../../api-utils/getVerifedUser";
import ControlledInput from "../../components/ControlledInput";
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Spinner,
} from "@chakra-ui/core";

async function api(endpoint: string, payload: any) {
  return fetch(`/api/${endpoint}`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (res) => {
    const body = await res.json();
    if (res.status !== 200) {
      throw new Error("Indubitably!");
    }
    return body;
  });
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = getVerifiedUser(context.req);
  if (!user) {
    redirect(context.res, "/account");
  }
  return { props: {} };
};

function LoginForm({}) {
  const [hasEmailed, setHasEmailed] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });
  if (hasEmailed) {
    return (
      <>
        <h2>Email Sent.</h2>
        <h3>Click the link to verify and log in</h3>
      </>
    );
  }
  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          api("login-register", {
            email: data.email,
          })
            .then((resp) => {
              setHasEmailed(true);
              setIsSubmitting(false);
            })
            .catch((err) => {
              console.error(err);
              setIsSubmitting(false);
            });
        })}
      >
        <FormControl>
          <FormLabel htmlFor="email-input">Login Email</FormLabel>
          <ControlledInput
            type="email"
            name="email"
            id="email-input"
            aria-describedby="email-helper-text"
            control={control}
          />
          <FormHelperText id="email-helper-text">
            Your email will be kept private.
          </FormHelperText>
        </FormControl>
        <p>
          By logging in, you agree to the{" "}
          <Link href="/terms-conditions">
            <a>Terms and Conditions</a>
          </Link>
          .
        </p>
        <Button type="submit">Log In</Button>
        {isSubmitting && <Spinner size="sm" />}
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Register or Login</title>
      </Head>
      <SiteLayout
        content={
          <>
            <h1>Register or Login</h1>
            <LoginForm />
          </>
        }
      />
    </>
  );
}
