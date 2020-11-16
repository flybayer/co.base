import { Button, Divider, Spinner } from "@chakra-ui/core";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "../api-utils/api";
import DashboardBreadcrumbs from "./DashboardBreadcrumbs";
import NodeChildren from "./NodeChildren";
import { LinkButton } from "./PostButton";
import SiteLayout from "./SiteLayout";

function DeleteButton({
  siteName,
  address,
}: {
  siteName: string;
  address: string[];
}) {
  const [isDeleting, setIsDel] = useState(false);
  const { push } = useRouter();
  return (
    <Button
      onClick={() => {
        setIsDel(true);
        api("node-destroy", {
          address,
          siteName,
        })
          .then(() => {
            push(
              `/sites/${siteName}/dashboard/${address
                .slice(0, address.length - 1)
                .join("/")}`
            );
          })
          .catch((e) => console.error(e))
          .finally(() => {
            setIsDel(false);
          });
      }}
      colorScheme="red"
      rightIcon={isDeleting ? <Spinner size="sm" /> : undefined}
    >
      Delete Node
    </Button>
  );
}

export default function NodeDashboard({
  siteName,
  address,
  node,
}: {
  siteName: string;
  address: string[];
  node: {
    children: Array<{
      key: string;
    }>;
  };
}) {
  const { push } = useRouter();
  return (
    <SiteLayout
      content={
        <>
          <DashboardBreadcrumbs siteName={siteName} address={address} />

          <Divider />

          <NodeChildren
            childs={node.children}
            address={address}
            siteName={siteName}
          />
          <LinkButton href={`/sites/${siteName}/create/${address.join("/")}`}>
            Add..
          </LinkButton>
          <Divider />
          <DeleteButton siteName={siteName} address={address} />
        </>
      }
    />
  );
}
