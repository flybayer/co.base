import Head from "next/head";
import MainWidth from "../../components/MainWidth";
import { FormGroup, InputGroup, Button } from "@blueprintjs/core";
import Link from "next/link";

function LoginForm({}) {
  return (
    <>
      <FormGroup
        helperText="Your email will be kept private."
        label="Login Email"
        labelFor="email-input"
        // labelInfo="(required)"
      >
        <InputGroup id="email-input" placeholder="me@email.com" type="email" />
      </FormGroup>
      <p>
        By logging in, you agree to the{" "}
        <Link href="/terms-conditions">Terms and Conditions</Link>.
      </p>
      <Button intent="primary" onClick={() => {}}>
        Log In
      </Button>
    </>
  );
}

export default function Home() {
  return (
    <>
      <Head>
        <title>Register or Login</title>
      </Head>
      <MainWidth>
        <h1>Register or Login</h1>
        <LoginForm />
      </MainWidth>
    </>
  );
}

Home.meta = { title: "Aven" };
