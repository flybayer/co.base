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
          onChange={(e: any) => {
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
  // const session = await database.session.findOne({
  //   where: { token: AvenSessionToken },
  //   select: {
  //     verifiedUser: {
  //       select: {
  //         username: true,
  //       },
  //     },
  //   },
  // });
  // if (session?.verifiedUser) {
  //   redirect(context.res, "/account");
  // }
  return { props: {} };
};

function NameForm({}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState(null);
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
          fetch("/api/login-register", {
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
        <title>Aven Account: Set Name</title>
      </Head>
      <SiteLayout content={<NameForm />} />
    </>
  );
}

Home.meta = { title: "Aven" };
