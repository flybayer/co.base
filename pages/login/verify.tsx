import { GetServerSideProps } from "next";
import { ReactElement } from "react";
import { atob } from "../../api-utils/Base64";
import setCookie from "../../api-utils/setCookie";
import { verifyEmail } from "../api/email-auth";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.query.token;
  const emailEncoded = context.query.email;
  const email = atob(String(emailEncoded));
  console.log("zoomies", { email, token });
  const redirect = context.query.redirect ? String(context.query.redirect) : "/account";
  try {
    const { jwt, user, isNewUser } = await verifyEmail(String(token), email);
    console.log("verified token", { token, user, isNewUser });
    setCookie(context.res, "AvenSession", jwt);
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
