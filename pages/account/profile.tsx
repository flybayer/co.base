import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { ReactElement } from "react";
import { AccountPage } from "../../lib/components/AccountPage";
import { MainSection } from "../../lib/components/CommonViews";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return {
    props: {
      user: verifiedUser,
    },
  };
};

export default function AccountProfilePage({ user }: { user: APIUser }): ReactElement {
  return (
    <AccountPage tab="profile" user={user}>
      <MainSection title="Username"></MainSection>
      <MainSection title="Name"></MainSection>
      <MainSection title="Bio"></MainSection>
    </AccountPage>
  );
}
