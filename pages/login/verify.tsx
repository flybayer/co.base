import { GetServerSideProps } from "next";
import { ReactElement } from "react";
import { atob } from "../../lib/server/Base64";
import { setAvenSession } from "../../lib/server/session";
import { verifyEmail } from "../api/email-auth";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.query.token;
  const email = atob(String(context.query.email));
  const redirect = context.query.redirect ? String(context.query.redirect) : "/account";
  try {
    const { jwt } = await verifyEmail(String(token), email);
    setAvenSession(context.res, jwt);
  } catch (e) {
    return { props: { error: e.message } };
  }
  return { redirect: { destination: redirect, permanent: false } };
};

export default function Verify({ error }: { error?: string }): ReactElement {
  if (error) {
    return <h3>Login Verify Error: {error}</h3>;
  }
  return <h2>Thanks for verifying</h2>;
}
