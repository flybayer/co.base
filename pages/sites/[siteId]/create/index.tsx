import { GetServerSideProps } from "next";
import { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../../../lib/server/getVerifedUser";
import { CreateNodeForm } from "../../../../lib/components/CreateForm";
import { BasicSiteLayout } from "../../../../lib/components/SiteLayout";
import { SiteTabs } from "../../../../lib/components/SiteTabs";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  const siteName = String(context.params?.siteId);
  if (!verifiedUser) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  return {
    props: {
      user: verifiedUser,
      siteName,
    },
  };
};

export default function CreateChildPage({ siteName, user }: { user: APIUser; siteName: string }): ReactElement {
  return (
    <BasicSiteLayout
      user={user}
      content={
        <>
          <SiteTabs tab="site" siteName={siteName} address={[]} />
          <CreateNodeForm siteName={siteName} address={[]} />
        </>
      }
    />
  );
}
