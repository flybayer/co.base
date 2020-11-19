import { Button, Select } from "@chakra-ui/core";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { api } from "../../../../api-utils/api";
import getVerifiedUser from "../../../../api-utils/getVerifedUser";
import { BasicSiteLayout } from "../../../../components/SiteLayout";
import { SiteTabs } from "../../../../components/SiteTabs";
import { database } from "../../../../data/database";

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
        schema: node.schema,
        value: node.value,
      },
    },
  };
};

function TypeSelector() {
  return (
    <Select>
      <option value="number">Number</option>
      <option value="boolean">Boolean</option>
      <option value="string">String</option>
      <option value="number">List</option>
      <option value="number">Object</option>
    </Select>
  );
}

type RecordSchema = {};

type NodeSchema = {
  record?: RecordSchema;
};

function RecordForm({
  record,
  onRecord,
}: {
  record: RecordSchema;
  onRecord: (r: RecordSchema) => void;
}) {
  return <TypeSelector />;
}

function SchemaForm({
  siteName,
  address,
  schema,
}: {
  siteName: string;
  address: string[];
  schema: NodeSchema;
}) {
  const [record, setRecord] = useState<RecordSchema>(schema.record || {});
  return (
    <div>
      <h2>{siteName}</h2>
      <RecordForm record={record} onRecord={setRecord} />
      <Button
        onClick={() => {
          api("node-schema-edit", { siteName, address, schema: { record } })
            .then(() => {
              alert("ok");
            })
            .catch(console.error);
        }}
        disabled={record === schema.record}
      >
        Save Schema
      </Button>
    </div>
  );
}

export default function ChildNodePage({
  siteName,
  address,
  node,
}: {
  siteName: string;
  address: string[];
  node: {
    value: any;
    schema?: NodeSchema;
  };
}) {
  return (
    <BasicSiteLayout
      content={
        <>
          <SiteTabs tab="schema" siteName={siteName} address={address} />
          <SchemaForm
            siteName={siteName}
            address={address}
            schema={node.schema || {}}
          />
        </>
      }
    />
  );
}
