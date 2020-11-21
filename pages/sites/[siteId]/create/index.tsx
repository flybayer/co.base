import { GetServerSideProps } from "next";
import getVerifiedUser from "../../../../api-utils/getVerifedUser";
import { CreateNodeForm } from "../../../../components/CreateForm";
import { BasicSiteLayout } from "../../../../components/SiteLayout";
import { SiteTabs } from "../../../../components/SiteTabs";

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
      siteName,
    },
  };
};

export default function CreateChildPage({ siteName }: { siteName: string }) {
  return (
    <BasicSiteLayout
      content={
        <>
          <SiteTabs tab="site" siteName={siteName} address={[]} />
          <CreateNodeForm siteName={siteName} address={[]} />
        </>
      }
    />
  );
}
