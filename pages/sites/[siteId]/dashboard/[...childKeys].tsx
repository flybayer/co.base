import { Button, Divider } from "@chakra-ui/core";
import styled from "@emotion/styled";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { api } from "../../../../api-utils/api";
import getVerifiedUser, { APIUser } from "../../../../api-utils/getVerifedUser";
import { LinkButton } from "../../../../components/Buttons";
import NodeChildren from "../../../../components/NodeChildren";

import SiteLayout, { BasicSiteLayout } from "../../../../components/SiteLayout";
import { SiteTabs } from "../../../../components/SiteTabs";
import { database } from "../../../../data/database";
import {
  NodeSchema,
  RecordSchema,
  RecordSetSchema,
  ValueSchema,
} from "../../../../data/NodeSchema";

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
        schema: node.schema,
        children,
      },
    },
  };
};

function RecordSetContent({
  siteName,
  address,
  node,
}: {
  siteName: string;
  address: string[];
  node: Node<RecordSetSchema>;
}) {
  return (
    <NodeChildren
      childs={node.children}
      address={address}
      siteName={siteName}
    />
  );
}

const StringText = styled.p`
  color: brown;
  font-size: 18px;
`;

const NumberText = styled.p`
  color: blue;
  font-size: 18px;
`;

const BooleanText = styled.p`
  color: green;
  font-size: 18px;
`;

type Node<Schema = NodeSchema> = {
  value: any;
  schema: Schema;
  children: Array<{
    key: string;
  }>;
};

function ValueDisplay({ schema, value }: { schema: ValueSchema; value: any }) {
  if (schema.type === "string") {
    if (value == null) return <p>Empty</p>;
    return <StringText>{value}</StringText>;
  }
  if (schema.type === "number") {
    if (value == null) return <p>Empty</p>;
    return <NumberText>{value}</NumberText>;
  }
  if (schema.type === "boolean") {
    if (value == null) return <p>Empty</p>;
    return <BooleanText>{value ? "True" : "False"}</BooleanText>;
  }

  if (schema.type === "array") {
    return (
      <div>
        {value.map((v: any, index: number) => (
          <ValueDisplay key={index} schema={schema.items} value={v} />
        ))}
      </div>
    );
  }

  if (schema.type === "object") {
    return (
      <div>
        obj
        {Object.entries(schema.properties).map(
          ([name, v]: [string, any], index: number) => (
            <div key={name}>
              {name}
              <ValueDisplay schema={v} value={value && value[name]} />
            </div>
          )
        )}
      </div>
    );
  }
  if (value === undefined) return <p>Undefined</p>;
  if (value === null) return <p>Null</p>;
  return <p>{JSON.stringify(value)}</p>;
}

function RecordContent({
  siteName,
  address,
  node,
}: {
  siteName: string;
  address: string[];
  node: Node<RecordSchema>;
}) {
  return (
    <>
      {node.schema.record && (
        <ValueDisplay value={node.value} schema={node.schema.record} />
      )}
      <LinkButton href={`/sites/${siteName}/edit/${address.join("/")}`}>
        Edit
      </LinkButton>
    </>
  );
}

function NodeContent({
  siteName,
  address,
  node,
}: {
  siteName: string;
  address: string[];
  node: Node;
}) {
  const nodeType = node.schema?.type || "record";
  if (nodeType === "record-set") {
    return (
      <RecordSetContent
        siteName={siteName}
        address={address}
        node={node as Node<RecordSetSchema>}
      />
    );
  }
  return (
    <RecordContent
      siteName={siteName}
      address={address}
      node={node as Node<RecordSchema>}
    />
  );
}

export default function NodeDashboard({
  siteName,
  address,
  node,
}: {
  siteName: string;
  address: string[];
  node: Node;
}) {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      content={
        <>
          <SiteTabs tab="data" siteName={siteName} address={address} />

          <Divider />

          <NodeContent node={node} address={address} siteName={siteName} />
        </>
      }
    />
  );
}
