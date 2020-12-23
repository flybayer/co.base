import { BasicSiteLayout } from "../../components/SiteLayout";
import { GetServerSideProps } from "next";
import React, { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { authRedirect } from "../../api-utils/authRedirect";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getVerifiedUser(context.req);
  if (!user) return authRedirect(context);
  return {
    props: {
      user,
    },
  };
};

export default function LoginPage({ user }: { user?: APIUser }): ReactElement {
  return <BasicSiteLayout user={user} title="Register Device" content={<h1>yes soon.</h1>} />;
}
