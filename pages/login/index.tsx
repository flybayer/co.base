import Head from "next/head";
import { FormGroup, InputGroup, Button, Spinner } from "@blueprintjs/core";
import Link from "next/link";
import { useForm, Controller, Control } from "react-hook-form";
import SiteLayout from "../../components/SiteLayout";
import { parseCookies } from "nookies";
import { database } from "../../data/database";
import { GetServerSideProps } from "next";
import React from "react";
import redirect from "../../api-utils/redirect";

function ControlledInputGroup({
  control,
  name,
}: { control: Control; name: string } & React.ComponentProps<
  typeof InputGroup
>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ onChange, onBlur, value, name }) => (
        <InputGroup
          value={value}
          name={name}
          onBlur={onBlur}
          onChange={(e) => {
            onChange(e.nativeEvent.target.value);
          }}
        />
      )}
    />
  );
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = parseCookies({ req: context.req });
  const { AvenSessionToken } = cookies;
  if (!AvenSessionToken) {
    return { props: {} };
  }
  console.log("lol wattth", AvenSessionToken);
  const session = await database.session.findOne({
    where: { token: AvenSessionToken },
    select: {
      verifiedUser: {
        select: {
          username: true,
        },
      },
    },
  });
  if (session?.verifiedUser) {
    redirect(context, "/account");
  }
  return { props: {} };
};

function LoginForm({}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });
  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          fetch("/api/login-register", {
            method: "post",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: data.email,
            }),
          })
            .then((res) => res.json())
            .then((resp) => {
              console.log("response: ", resp);
              setIsSubmitting(false);
            })
            .catch((err) => {
              console.error(err);
              setIsSubmitting(false);
            });
        })}
      >
        <FormGroup
          helperText="Your email will be kept private."
          label="Login Email"
          labelFor="email-input"
        >
          <ControlledInputGroup
            id="email-input"
            placeholder="me@email.com"
            type="email"
            name="email"
            control={control}
          />
        </FormGroup>
        <p>
          By logging in, you agree to the{" "}
          <Link href="/terms-conditions">
            <a>Terms and Conditions</a>
          </Link>
          .
        </p>
        <button
          type="submit"
          className="bp3-button bp3-intent-primary"
          // intent="primary"
          // onClick={handleSubmit((data) => console.log(data))}
        >
          <span className="bp3-button-text">Log In</span>
        </button>
        {isSubmitting && <Spinner size={Spinner.SIZE_SMALL} />}
      </form>
    </>
  );
}

export default function Home() {
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

Home.meta = { title: "Aven" };
