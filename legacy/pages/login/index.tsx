import Link from "next/link";
import { useForm } from "react-hook-form";
import SiteLayout, { SmallFormPage } from "../../lib/components/SiteLayout";
import { GetServerSideProps } from "next";
import React, { ReactElement, ReactNode } from "react";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import ControlledInput from "../../lib/components/ControlledInput";
import { Button, Divider, FormControl, FormHelperText, FormLabel, Spinner } from "@chakra-ui/core";
import { useRouter } from "next/router";
import { api } from "../../lib/server/api";
import { Error400 } from "../../lib/server/Errors";
import { LinkButton } from "../../lib/components/Buttons";
import { handleAsync } from "../../lib/data/handleAsync";
import { LoginRegisterResponse } from "../api/login-register";
import styled from "@emotion/styled";
import { primaryColor } from "../_app";

const TextLinkA = styled.a`
  color: ${primaryColor};
  text-decoration: underline;
`;
function TextLink({ href, children }: { href: string; children: ReactNode }): ReactElement {
  return (
    <Link href={href} passHref>
      <TextLinkA>{children}</TextLinkA>
    </Link>
  );
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getVerifiedUser(context.req, context.res);
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
        <Button type="submit" colorScheme="avenColor">
          Log In
        </Button>
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
          {/* <FormLabel htmlFor="email-input">Login Email or Username</FormLabel> */}
          {errors.email && <p>{errors.email.message}</p>}
          <ControlledInput
            name="email"
            id="email-input"
            aria-describedby="email-helper-text"
            control={control}
            placeholder="Email or Username"
          />
          <FormHelperText id="email-helper-text">
            By logging in, you agree to the <TextLink href="/legal/terms-of-service">Terms of Service</TextLink>.
          </FormHelperText>
        </FormControl>

        <Button type="submit" colorScheme="avenColor">
          Log In
        </Button>

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
    <SiteLayout
      title="Register / Log In"
      content={
        currentUser ? (
          <SmallFormPage title={`Logged in as @${currentUser.username}`}>
            <LinkButton href="/account">Go to Account</LinkButton>
          </SmallFormPage>
        ) : (
          <SmallFormPage title="Register / Log In">
            <LoginForm redirect={redirect} />
          </SmallFormPage>
        )
      }
    />
  );
}
