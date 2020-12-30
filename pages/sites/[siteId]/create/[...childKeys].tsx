import { GetServerSideProps } from "next";
import { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../../../lib/server/getVerifedUser";
import { CreateNodeForm } from "../../../../lib/components/CreateForm";
import { BasicSiteLayout } from "../../../../lib/components/SiteLayout";
import { SiteTabs } from "../../../../lib/components/SiteTabs";
import { database } from "../../../../lib/data/database";
import { NodeSchema } from "../../../../lib/data/NodeSchema";
import { siteNodeQuery } from "../../../../lib/data/SiteNodes";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  const siteName = String(context.params?.siteId);
  const childKeys = String(context.params?.childKeys || "").split(",");
  if (!verifiedUser) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  const nodeQuery = siteNodeQuery(siteName, childKeys);
  const node = nodeQuery && (await database.siteNode.findFirst({ where: nodeQuery, select: { schema: true } }));
  if (!node) return { redirect: { destination: "/account", permanent: false } };
  return {
    props: {
      user: verifiedUser,
      siteName,
      address: childKeys,
      schema: node.schema,
    },
  };
};

export default function CreateChildPage({
  user,
  siteName,
  address,
  schema,
}: {
  user: APIUser;
  siteName: string;
  address: string[];
  schema: NodeSchema;
}): ReactElement {
  return (
    <BasicSiteLayout
      user={user}
      isDashboard
      content={
        <>
          <SiteTabs tab="data" siteName={siteName} address={address} />

          <CreateNodeForm siteName={siteName} address={address} parentSchema={schema} />
        </>
      }
    />
  );
}
