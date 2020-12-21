import { GetServerSideProps } from "next";
import { ReactElement } from "react";
import { Error400 } from "../../api-utils/Errors";
import { verifyEmail } from "../api/email-auth";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.query.token;
  if (!context.query.email) throw new Error400({ name: "EmailNotProvided" });
  const email = atob(String(context.query.email));
  try {
    await verifyEmail(String(token), email);
  } catch (e) {
    return { props: { error: e.message } };
  }
  return { redirect: { destination: "/account", permanent: false } };
};

export default function Verify({ error }: { error?: string }): ReactElement {
  if (error) {
    return <h3>Account Verify Error: {error}</h3>;
  }
  return <h2>Thanks for verifying</h2>;
}
