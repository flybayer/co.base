import { GetServerSideProps } from "next";
import setCookie from "../../api-utils/setCookie";
import { verifyEmail } from "../api/email-auth";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.query.token;
  const redirect = context.query.redirect ? String(context.query.redirect) : "/account";
  const { jwt, user, isNewUser } = await verifyEmail(String(token));
  setCookie(context.res, "AvenSession", jwt);
  return { redirect: { destination: redirect, permanent: false } };
};

export default function Verify() {
  return <h2>Thanks for verifying</h2>;
}
