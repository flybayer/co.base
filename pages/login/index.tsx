import Head from "next/head";
import Link from "next/link";
import { useForm } from "react-hook-form";
import SiteLayout from "../../components/SiteLayout";
import { GetServerSideProps } from "next";
import React, { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import ControlledInput from "../../components/ControlledInput";
import { Button, Divider, FormControl, FormHelperText, FormLabel, Spinner } from "@chakra-ui/core";
import { useRouter } from "next/router";
import { api } from "../../api-utils/api";
import { Error400 } from "../../api-utils/Errors";
import { LinkButton } from "../../components/Buttons";
import { handleAsync } from "../../data/handleAsync";
import { LoginRegisterResponse } from "../api/login-register";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getVerifiedUser(context.req);
  if (user) {
    return {
      redirect: {
        destination: "/account",
        permanent: false,
      },
    };
  }
  return {
    props: {
      currentUser: user,
      redirect: context.query.redirect || null,
    },
  };
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
          <ControlledInput type="password" name="password" id="password-input" control={control} />
        </FormControl>
        <Button type="submit">Log In</Button>
      </form>
      <Divider />
      <Button onClick={onEmail}>Email me a login link</Button>
    </>
  );
}

function LoginForm({ redirect }: { redirect?: string }) {
  const [submittedEmail, setSubmittedEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState(0);
  const { push } = useRouter();
  const { register, handleSubmit, errors, control, setError } = useForm({
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
            redirect,
          })
            .then((resp) => {
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
            redirect,
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
          handleAsync(
            api<LoginRegisterResponse>("login-register", {
              email: data.email,
              redirect,
            }),
            (resp: LoginRegisterResponse) => {
              setStatus(resp.status === 1 ? 1 : 2);
            },
          )
            .catch((err: Error400) => {
              setError("email", {
                message: err.detail.message,
                shouldFocus: true,
              });
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        })}
      >
        <FormControl>
          <FormLabel htmlFor="email-input">Login Email or Username</FormLabel>
          {errors.email && <p>{errors.email.message}</p>}
          <ControlledInput name="email" id="email-input" aria-describedby="email-helper-text" control={control} />
          <FormHelperText id="email-helper-text">Your email will be kept private.</FormHelperText>
        </FormControl>
        <p>
          By logging in, you agree to the{" "}
          <Link href="/legal/terms-of-service">
            <a>Terms of Service</a>
          </Link>
          .
        </p>
        <Button type="submit">Log In</Button>
        {isSubmitting && <Spinner size="sm" />}
      </form>
    </>
  );
}

export default function LoginPage({
  currentUser,
  redirect,
}: {
  currentUser?: APIUser;
  redirect?: string;
}): ReactElement {
  return (
    <>
      <Head>
        <title>Login or Register</title>
      </Head>
      <SiteLayout
        content={
          currentUser ? (
            <>
              <h1>You are logged in.</h1>
              <LinkButton href="/account">Go to Account</LinkButton>
            </>
          ) : (
            <>
              <h1>Login or Register</h1>
              <LoginForm redirect={redirect} />
            </>
          )
        }
      />
    </>
  );
}
