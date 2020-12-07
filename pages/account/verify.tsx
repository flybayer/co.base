import { GetServerSideProps } from "next";
import { verifyEmail } from "../api/email-auth";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.query.token;
  await verifyEmail(String(token));
  return { redirect: { destination: "/account", permanent: false } };
};

export default function Verify() {
  return <h2>Thanks for verifying</h2>;
}
