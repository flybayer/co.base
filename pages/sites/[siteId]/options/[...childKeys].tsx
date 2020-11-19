import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { api } from "../../../../api-utils/api";
import getVerifiedUser, { APIUser } from "../../../../api-utils/getVerifedUser";
import { database } from "../../../../data/database";
import { Button, Divider, Spinner } from "@chakra-ui/core";
import { useState } from "react";
import { SiteTabs } from "../../../../components/SiteTabs";
import { LinkButton } from "../../../../components/Buttons";
import NodeChildren from "../../../../components/NodeChildren";
import { BasicSiteLayout } from "../../../../components/SiteLayout";

type ManyQuery = null | {
  parentNode: ManyQuery;
  key: string;
  site: { name: string };
};
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
  const site = await database.site.findOne({ where: { name: siteName } });
  const siteQuery = { name: siteName };
  //   const node = await database.siteNode()

  const whereQ = childKeys.reduce<any>(
    (last: ManyQuery, childKey: string, childKeyIndex: number): ManyQuery => {
      return { site: siteQuery, parentNode: last, key: childKey };
    },
    null
  ) as ManyQuery;
  if (whereQ === null) throw new Error("Unexpectd nullfail");
  let nodes = await database.siteNode.findMany({
    where: whereQ,
    include: { SiteNode: { select: { id: true, key: true } } },
  });

  //   const childNodes = await database.siteNode.findMany({
  //     where: { site: siteQuery, parentNode: { id: 1 } },
  //   });
  const node = nodes[0];
  if (!node) {
    return {
      redirect: {
        destination: `/sites/${siteName}/dashboard/${childKeys
          .slice(0, childKeys.length - 1)
          .join("/")}`,
        permanent: false,
      },
    };
  }
  const children = node.SiteNode;
  console.log({ site, node, childKeys, children });

  return {
    props: {
      user: verifiedUser,
      siteName,
      address: childKeys,
      node: {
        value: node.value,
        children,
      },
    },
  };
};

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

export default function NodeOptionsPage({
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
          <SiteTabs tab="options" siteName={siteName} address={address} />

          <DeleteButton siteName={siteName} address={address} />
        </>
      }
    />
  );
}
