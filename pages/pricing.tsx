import PricingGrid from "../lib/components/PricingGrid";
import { GetServerSideProps } from "next";
import SiteLayout from "../lib/components/SiteLayout";
import getVerifiedUser, { APIUser } from "../lib/server/getVerifedUser";
import { ReactElement } from "react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  return {
    props: {
      user: verifiedUser,
    },
  };
};

export default function PricingPage({ user }: { user: APIUser }): ReactElement {
  return (
    <SiteLayout
      user={user}
      content={
        <>
          <PricingGrid user={user} />
        </>
      }
    />
  );
}
