import {
  Button,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Switch,
} from "@chakra-ui/core";
import { CloseIcon } from "@chakra-ui/icons";
import styled from "@emotion/styled";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../../api-utils/api";
import getVerifiedUser, { APIUser } from "../../../../api-utils/getVerifedUser";
import { LinkButton } from "../../../../components/Buttons";
import { ListContainer } from "../../../../components/List";
import NodeChildren from "../../../../components/NodeChildren";

import SiteLayout, { BasicSiteLayout } from "../../../../components/SiteLayout";
import { SiteTabs } from "../../../../components/SiteTabs";
import { database } from "../../../../data/database";
import {
  DEFAULT_SCHEMA,
  DEFAULT_VALUE_SCHEMA,
  getDefaultValue,
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

function TextInputDisplay({
  label,
  value,
  onValue,
  schema,
  numeric,
}: {
  label: string;
  value: number | string;
  onValue?: (s: number | string) => void;
  schema: any;
  numeric?: boolean;
}) {
  const [v, setV] = useState(String(value));
  const onValueTimeout = useRef<null | NodeJS.Timeout>(null);

  return (
    <div>
      {label} :
      <Input
        value={onValue ? v : value}
        onChange={(e) => {
          if (!onValue) return;
          const newValue = e.target.value;
          setV(newValue);
          if (typeof onValueTimeout.current === "number")
            clearTimeout(onValueTimeout.current);
          onValueTimeout.current = setTimeout(() => {
            onValue(numeric ? Number(newValue) : newValue);
            console.log(newValue);
          }, 200);
        }}
      />
    </div>
  );
}

function BooleanDisplay({
  label,
  value,
  onValue,
  schema,
}: {
  label: string;
  value: boolean;
  onValue?: (s: boolean) => void;
  schema: any;
}) {
  return (
    <div>
      {value ? "True" : "False"}
      <FormControl display="flex" alignItems="center">
        <FormLabel htmlFor={`${label}-input`} mb="0">
          {label}
        </FormLabel>
        <Switch
          id={`${label}-input`}
          isChecked={value}
          disabled={!onValue}
          onChange={(e) => {
            onValue && onValue(e.target.checked);
          }}
        />
      </FormControl>
    </div>
  );
}

function ArrayDisplay({
  label,
  value,
  onValue,
  schema,
}: {
  label: string;
  value: any;
  onValue?: (s: any) => void;
  schema: any;
}) {
  const listValue = value == null ? [] : value;

  if (!Array.isArray(listValue)) {
    return (
      <div>
        <h3>Whoops! This value should be an array. Instead, it is:</h3>
        <p>{JSON.stringify(value, null, 2)}</p>
        <p>You may click here to DELETE this data, and reset this array:</p>
        {onValue && <Button onClick={() => onValue([])}>Reset Array</Button>}
      </div>
    );
  }
  return (
    <ListContainer>
      {listValue.map((v: any, index: number) => (
        <div>
          {onValue && (
            <Button
              onClick={() => {
                const a = [...listValue];
                a.splice(index, 1);
                onValue(a);
              }}
            >
              <CloseIcon />
            </Button>
          )}
          <ValueDisplay
            key={index}
            label={String(index)}
            schema={schema.items}
            value={v}
            onValue={
              onValue &&
              ((child: any) => {
                const v = [...value];
                v[index] = child;
                onValue(v);
              })
            }
          />
        </div>
      ))}

      {onValue && (
        <Button
          onClick={() => {
            onValue([...value, getDefaultValue(schema.items)]);
          }}
        >
          New Item
        </Button>
      )}
    </ListContainer>
  );
}

function ObjectDisplay({
  label,
  value,
  onValue,
  schema,
}: {
  label: string;
  value: any;
  onValue?: (s: any) => void;
  schema: any;
}) {
  return (
    <div>
      {label}
      {Object.entries(schema.properties).map(
        ([keyName, v]: [string, any], index: number) => (
          <div key={keyName}>
            <ValueDisplay
              label={keyName}
              schema={v}
              value={value && value[keyName]}
              onValue={
                onValue &&
                ((child: any) => {
                  onValue({ ...value, [keyName]: child });
                })
              }
            />
          </div>
        )
      )}
    </div>
  );
}

function ValueDisplay({
  label,
  schema,
  value,
  onValue,
}: {
  label: string;
  schema: ValueSchema;
  value: any;
  onValue?: (v: any) => void;
}) {
  if (schema.type === "string") {
    return (
      <TextInputDisplay
        schema={schema}
        value={value}
        onValue={onValue}
        label={label}
      />
    );
  }
  if (schema.type === "number") {
    return (
      <TextInputDisplay
        schema={schema}
        value={value}
        onValue={onValue}
        label={label}
        numeric
      />
    );
  }
  if (schema.type === "boolean") {
    return (
      <BooleanDisplay
        schema={schema}
        value={value}
        onValue={onValue}
        label={label}
      />
    );
  }
  if (schema.type === "array") {
    return (
      <ArrayDisplay
        schema={schema}
        value={value}
        onValue={onValue}
        label={label}
      />
    );
  }
  if (schema.type === "object") {
    return (
      <ObjectDisplay
        schema={schema}
        value={value}
        onValue={onValue}
        label={label}
      />
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
  const recordSchema = node.schema.record
    ? node.schema.record
    : DEFAULT_VALUE_SCHEMA;
  const initValue =
    node.value === null ? getDefaultValue(recordSchema) : node.value;
  let [savedNodeValue, setSavedNodeValue] = useState(initValue);
  let [nodeValue, setNodeValue] = useState(initValue);
  return (
    <>
      <ValueDisplay
        label={`${siteName}/${address.join("/")}`}
        value={nodeValue}
        schema={recordSchema}
        onValue={(value: any) => {
          setNodeValue(value);
        }}
      />
      {savedNodeValue !== nodeValue && (
        <div>
          <Button
            onClick={() => {
              api("node-edit", { siteName, address, value: nodeValue })
                .then(() => {
                  setSavedNodeValue(nodeValue);
                })
                .catch((e) => {
                  console.error(e);
                  alert("error saving");
                });
            }}
          >
            Save
          </Button>
          <Button
            onClick={() => {
              setNodeValue(savedNodeValue);
            }}
          >
            Cancel
          </Button>
        </div>
      )}
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
