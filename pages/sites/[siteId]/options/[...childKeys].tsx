import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { api } from "../../../../api-utils/api";
import getVerifiedUser, { APIUser } from "../../../../api-utils/getVerifedUser";
import { database } from "../../../../data/database";
import { Button, Divider, Select, Spinner } from "@chakra-ui/core";
import { ReactElement, ReactNode, useState } from "react";
import { SiteTabs } from "../../../../components/SiteTabs";
import { LinkButton } from "../../../../components/Buttons";
import NodeChildren from "../../../../components/NodeChildren";
import { BasicSiteLayout } from "../../../../components/SiteLayout";
import { NodeSchema, NodeType, nodeTypeName, RecordSchema } from "../../../../data/NodeSchema";
import { CenterButtonRow, MainContainer, MainSection } from "../../../../components/CommonViews";
import styled from "@emotion/styled";
import { observe, generate } from "fast-json-patch";
import { handleAsync } from "../../../../data/handleAsync";

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
  const site = await database.site.findUnique({ where: { name: siteName } });
  const siteQuery = { name: siteName };
  //   const node = await database.siteNode()

  const whereQ = childKeys.reduce<any>((last: ManyQuery, childKey: string, childKeyIndex: number): ManyQuery => {
    return { site: siteQuery, parentNode: last, key: childKey };
  }, null) as ManyQuery;
  if (whereQ === null) throw new Error("Unexpectd nullfail");
  const nodes = await database.siteNode.findMany({
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
        destination: `/sites/${siteName}/dashboard/${childKeys.slice(0, childKeys.length - 1).join("/")}`,
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
        schema: node.schema,
        children,
      },
    },
  };
};

function DeleteButton({ siteName, address, nodeType }: { siteName: string; address: string[]; nodeType?: NodeType }) {
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
              address.length > 1
                ? `/sites/${siteName}/dashboard/${address.slice(0, address.length - 1).join("/")}`
                : `/sites/${siteName}`,
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
      Permanently Delete {nodeTypeName(nodeType || "record")} &quot;{address[address.length - 1]}&quot;
    </Button>
  );
}

const TTL_VALUES = [
  { label: "Live Connection", value: 0 },
  { label: "10 Seconds", value: 10 },
  { label: "1 Minute", value: 60 },
  { label: "5 Minutes", value: 60 * 5 },
  { label: "15 Minutes", value: 60 * 15 },
  { label: "1 Hour", value: 60 * 60 },
  { label: "12 Hours", value: 60 * 60 * 12 },
  { label: "1 Day", value: 60 * 60 * 24 },
];
const RowThing = styled.div`
  display: flex;
`;
function ExpirationSection({
  schema,
  siteName,
  address,
}: {
  schema?: NodeSchema;
  siteName: string;
  address: string[];
}): ReactElement | null {
  const [isSpinning, setIsSpinning] = useState(false);

  if (schema?.type !== "record") return null;

  return (
    <MainSection title="Expiration">
      Lifetime before refresh:
      <RowThing>
        <Select
          value={schema.tti}
          onChange={(e) => {
            const observer = observe<RecordSchema>(schema);
            schema.tti = Number(e.target.value);
            const schemaPatch = generate(observer);
            setIsSpinning(true);
            handleAsync(
              api("node-schema-edit", {
                schemaPatch,
                siteName,
                address,
              }),
              () => {
                setIsSpinning(false);
              },
            );
          }}
        >
          {TTL_VALUES.map(({ value, label }) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </Select>
        <Spinner thickness={isSpinning ? "4px" : "0px"} color="blue.500" />
      </RowThing>
    </MainSection>
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
    schema?: NodeSchema;
    children: Array<{
      key: string;
    }>;
  };
}): ReactElement {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      content={
        <>
          <SiteTabs tab="options" siteName={siteName} address={address} />
          <MainContainer>
            <ExpirationSection schema={node.schema} address={address} siteName={siteName} />

            <MainSection title="Move Node">
              <CenterButtonRow>
                <Button>Rename {address.join("/")}</Button>
              </CenterButtonRow>
            </MainSection>
            <MainSection title="Danger">
              <CenterButtonRow>
                <DeleteButton siteName={siteName} address={address} nodeType={node.schema?.type} />
              </CenterButtonRow>
            </MainSection>
          </MainContainer>
        </>
      }
    />
  );
}
