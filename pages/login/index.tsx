import Head from "next/head";
import Link from "next/link";
import { useForm } from "react-hook-form";
import SiteLayout from "../../components/SiteLayout";
import { GetServerSideProps } from "next";
import React from "react";
import getVerifiedUser from "../../api-utils/getVerifedUser";
import ControlledInput from "../../components/ControlledInput";
import {
  Button,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Spinner,
} from "@chakra-ui/core";
import { useRouter } from "next/router";

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
    return {
      redirect: {
        destination: "/account",
        permanent: false,
      },
    };
  }
  return { props: {} };
};

function PasswordForm({
  email,
  onPassword,
  onEmail,
}: {
  email: string;
  onPassword: (password: string) => void;
  onEmail: () => void;
}) {
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      password: "",
    },
  });
  return (
    <>
      <p>Email: {email}</p>
      <form
        onSubmit={handleSubmit((data) => {
          onPassword(data.password);
        })}
      >
        <h2>Password?</h2>
        <FormControl>
          <FormLabel htmlFor="password-input">Password</FormLabel>
          <ControlledInput
            type="password"
            name="password"
            id="password-input"
            control={control}
          />
        </FormControl>
        <Button type="submit">Log In</Button>
      </form>
      <Divider />
      <Button onClick={onEmail}>Email me a login link</Button>
    </>
  );
}

function LoginForm({}) {
  const [submittedEmail, setSubmittedEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState(0);
  const { push } = useRouter();
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });
  if (status === 1 && submittedEmail) {
    return (
      <PasswordForm
        email={submittedEmail}
        onPassword={(password: string) => {
          api("login-register", {
            email: submittedEmail,
            password,
          })
            .then((resp) => {
              console.log("hey ok", resp);
              push("/account");
            })
            .catch((err) => {
              console.error(err);
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        }}
        onEmail={async () => {
          await api("login-register", {
            email: submittedEmail,
            method: "email",
          });
          setStatus(2);
        }}
      />
    );
  }
  if (status === 2) {
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
          setSubmittedEmail(data.email);
          api("login-register", {
            email: data.email,
          })
            .then((resp) => {
              setStatus(resp.status === 1 ? 1 : 2);
            })
            .catch((err) => {
              console.error(err);
            })
            .finally(() => {
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
