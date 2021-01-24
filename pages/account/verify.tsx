import { GetServerSideProps } from "next";
import { ReactElement } from "react";
import { BasicSiteLayout } from "../../lib/components/SiteLayout";
import { atob } from "../../lib/server/Base64";
import { Error400 } from "../../lib/server/Errors";
import { verifyEmail } from "../../lib/server/EmailAuth";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.query.token;
  if (!context.query.email) throw new Error400({ name: "EmailNotProvided" });
  const email = atob(String(context.query.email));
  try {
    await verifyEmail(String(token), email);
  } catch (e) {
    return { props: { error: e.message } };
  }
  return { redirect: { destination: "/account/auth", permanent: false } };
};

export default function Verify({ error }: { error?: string }): ReactElement {
  let content = null;
  if (error) {
    content = <h3>Account Verify Error: {error}</h3>;
  } else {
    content = <h2>Thanks for verifying</h2>;
  }
  return <BasicSiteLayout title="Account Verification" isDashboard content={content} />;
}
