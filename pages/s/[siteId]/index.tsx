import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../../lib/server/getVerifedUser";
import NodeChildren from "../../../lib/components/NodeChildren";
import { BasicSiteLayout } from "../../../lib/components/SiteLayout";
import { SiteTabs } from "../../../lib/components/SiteTabs";
import { database } from "../../../lib/data/database";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  const siteName = String(context.params?.siteId);
  if (!verifiedUser) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  const site = await database.site.findUnique({ where: { name: siteName } });
  if (!site) return { redirect: { destination: "/account", permanent: false } };
  const nodes = await database.siteNode.findMany({
    where: { site: { name: siteName }, parentNode: null },
    select: { key: true, id: true },
  });
  return {
    props: {
      user: verifiedUser,
      siteName,
      nodes,
    },
  };
};

export default function SiteSettingsPage({
  user,
  siteName,
  nodes,
}: {
  user: APIUser;
  siteName: string;
  nodes: Array<{
    key: string;
  }>;
}): ReactElement {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      user={user}
      isDashboard
      content={
        <>
          <SiteTabs tab="site" siteName={siteName} />
          <NodeChildren childs={nodes} address={[]} siteName={siteName} />
        </>
      }
    />
  );
}
