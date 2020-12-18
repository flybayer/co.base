import PricingGrid from "../components/PricingGrid";
import { GetServerSideProps } from "next";
import SiteLayout, { BasicSiteLayout } from "../components/SiteLayout";
import getVerifiedUser, { APIUser } from "../api-utils/getVerifedUser";
import { ReactElement } from "react";
import { PaddleSetup } from "../components/Paddle";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
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
          <PaddleSetup />
          <PricingGrid user={user} />
        </>
      }
    />
  );
}
