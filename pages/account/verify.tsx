import { error } from "ajv/dist/vocabularies/applicator/dependencies";
import { GetServerSideProps } from "next";
import { ReactElement } from "react";
import { verifyEmail } from "../api/email-auth";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.query.token;
  try {
    await verifyEmail(String(token));
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
