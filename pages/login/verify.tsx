import { GetServerSideProps } from "next";
import { verifyEmail } from "../api/email-auth";
import setCookie from "../../api-utils/setCookie";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.query.token;
  const { jwt, user, isNewUser } = await verifyEmail(String(token));
  setCookie(context.res, "AvenSession", jwt);
  (context.res as any).redirect("/account");
  return { props: {} };
};

export default function VerifyPage({}) {
  return null;
}
