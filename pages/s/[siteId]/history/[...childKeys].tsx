import { GetServerSideProps } from "next";
import { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../../../lib/server/getVerifedUser";
import { MainSection } from "../../../../lib/components/CommonViews";
import { BasicSiteLayout } from "../../../../lib/components/SiteLayout";
import { SiteTabs } from "../../../../lib/components/SiteTabs";
import { database } from "../../../../lib/data/database";
import { DEFAULT_SCHEMA, NodeSchema } from "../../../../packages/client/src/NodeSchema";
import { siteNodeQuery } from "../../../../lib/data/SiteNodes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
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
  const site = await database.site.findUnique({ where: { name: siteName } });
  if (!site) return { redirect: { destination: "/account", permanent: false } };

  const siteQuery = { name: siteName };
  const nodesQuery = siteNodeQuery(siteName, childKeys);
  if (nodesQuery === null) throw new Error("Unexpectd nullfail");
  const nodes = await database.siteNode.findMany({
    where: nodesQuery,
  });
  const node = nodes[0];
  if (!node) {
    return {
      redirect: {
        destination: `/s/${siteName}/dashboard/${childKeys.slice(0, childKeys.length - 1).join("/")}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: verifiedUser,
      siteName,
      address: childKeys,
      node: {
        schema: node.schema || DEFAULT_SCHEMA,
        value: node.value,
      },
    },
  };
};

export default function NodeHistoryPage({
  user,
  siteName,
  address,
  node,
}: {
  user: APIUser;
  siteName: string;
  address: string[];
  node: {
    value: any;
    schema: NodeSchema;
  };
}): ReactElement {
  return (
    <BasicSiteLayout
      user={user}
      isDashboard
      content={
        <>
          <SiteTabs tab="history" siteName={siteName} address={address} />
          <MainSection>
            <FontAwesomeIcon icon={["fal", "users"]} color="blue" />
            <FontAwesomeIcon icon={["fal", "users-cog"]} color="blue" />
            <FontAwesomeIcon icon={["fal", "key"]} color="blue" />
            <FontAwesomeIcon icon={["fal", "envelope-open-text"]} color="blue" />
            <FontAwesomeIcon icon={["fal", "sticky-note"]} color="blue" />
            <FontAwesomeIcon icon={["fal", "layer-group"]} color="blue" />
            <FontAwesomeIcon icon={["fal", "cog"]} color="blue" />
            <FontAwesomeIcon icon={["fal", "folder-open"]} color="blue" />
            <FontAwesomeIcon icon={["fal", "home"]} color="blue" />
            <FontAwesomeIcon icon={["fal", "cubes"]} color="blue" />
            {/* <FontAwesomeIcon icon={["fal", ""]} color="blue" /> */}

            {/* <Icon icon={["fal", "coffee"]} /> */}
          </MainSection>
        </>
      }
    />
  );
}
