import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { ReactElement, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../../../../api-utils/api";
import { Error500 } from "../../../../api-utils/Errors";
import getVerifiedUser, { APIUser } from "../../../../api-utils/getVerifedUser";
import ControlledInput from "../../../../components/ControlledInput";
import { CreateNodeForm } from "../../../../components/CreateForm";

import SiteLayout, { BasicSiteLayout } from "../../../../components/SiteLayout";
import { SiteTabs } from "../../../../components/SiteTabs";
import { database } from "../../../../data/database";
import { NodeSchema } from "../../../../data/NodeSchema";
import { siteNodeQuery } from "../../../../data/SiteNodes";

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
  if (!node) {
    throw new Error500({ name: "NodeNotFound" });
  }
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
      content={
        <>
          <SiteTabs tab="data" siteName={siteName} address={address} />

          <CreateNodeForm siteName={siteName} address={address} parentSchema={schema} />
        </>
      }
    />
  );
}
