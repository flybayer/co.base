import { GetServerSideProps } from "next";
import getVerifiedUser from "../../../../api-utils/getVerifedUser";
import { CreateNodeForm } from "../../../../components/CreateForm";
import DashboardBreadcrumbs from "../../../../components/DashboardBreadcrumbs";
import SiteLayout from "../../../../components/SiteLayout";

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
    <SiteLayout
      content={
        <>
          <DashboardBreadcrumbs
            siteName={siteName}
            address={[]}
            nodeFeature="Create"
          />

          <h3>Create New Node under {siteName}</h3>
          <CreateNodeForm siteName={siteName} address={[]} />
        </>
      }
    />
  );
}
