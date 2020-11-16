import { Button, Divider } from "@chakra-ui/core";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { api } from "../../../../api-utils/api";
import getVerifiedUser, { APIUser } from "../../../../api-utils/getVerifedUser";
import DashboardBreadcrumbs from "../../../../components/DashboardBreadcrumbs";
import NodeChildren from "../../../../components/NodeChildren";
import { LinkButton } from "../../../../components/PostButton";
import SiteLayout from "../../../../components/SiteLayout";
import { database } from "../../../../data/database";

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
  // const site = await database.site.findOne({ where: { name: siteName } });
  const nodes = await database.siteNode.findMany({
    where: { site: { name: siteName }, parentNode: null },
    select: { key: true, id: true },
  });

  return {
    props: {
      // user: verifiedUser,
      siteName,
      rootNodes: nodes,
    },
  };
};

export default function SiteDashboard({
  siteName,
  rootNodes,
}: {
  siteName: string;
  rootNodes: Array<{
    key: string;
  }>;
}) {
  return (
    <SiteLayout
      content={
        <>
          <h3>Site Dash: {siteName}</h3>
          <DashboardBreadcrumbs siteName={siteName} address={[]} />
          <Divider />

          <NodeChildren childs={rootNodes} address={[]} siteName={siteName} />
          <LinkButton href={`/sites/${siteName}/create`}>Add..</LinkButton>

          <Divider />
          <Link href={`/sites/${siteName}`}>
            <Button>Site Settings</Button>
          </Link>
        </>
      }
    />
  );
}
