import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import NodeChildren from "../../../components/NodeChildren";
import { BasicSiteLayout } from "../../../components/SiteLayout";
import { SiteTabs } from "../../../components/SiteTabs";
import { database } from "../../../data/database";

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
  const site = await database.site.findOne({ where: { name: siteName } });
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
}) {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      content={
        <>
          <SiteTabs tab="site" siteName={siteName} />
          <NodeChildren childs={nodes} address={[]} siteName={siteName} />
        </>
      }
    />
  );
}
