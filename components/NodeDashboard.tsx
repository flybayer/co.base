import { Button, Divider, Spinner } from "@chakra-ui/core";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "../api-utils/api";
import NodeChildren from "./NodeChildren";
import { LinkButton } from "./PostButton";
import { BasicSiteLayout } from "./SiteLayout";
import { SiteTabs } from "./SiteTabs";

export default function NodeDashboard({
  siteName,
  address,
  node,
}: {
  siteName: string;
  address: string[];
  node: {
    value: any;
    children: Array<{
      key: string;
    }>;
  };
}) {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      content={
        <>
          <SiteTabs tab="data" siteName={siteName} address={address} />

          <Divider />

          <p>{JSON.stringify(node.value)}</p>
          <LinkButton href={`/sites/${siteName}/edit/${address.join("/")}`}>
            Edit
          </LinkButton>
          <Divider />
          <NodeChildren
            childs={node.children}
            address={address}
            siteName={siteName}
          />
        </>
      }
    />
  );
}
