import { Button, FormControl, FormLabel, Input, Switch } from "@chakra-ui/core";
import { CloseIcon } from "@chakra-ui/icons";
import styled from "@emotion/styled";
import { GetServerSideProps } from "next";
import { ReactElement, useRef, useState } from "react";
import { api } from "../../../../lib/server/api";
import getVerifiedUser, { APIUser } from "../../../../lib/server/getVerifedUser";
import { MainSection } from "../../../../lib/components/CommonViews";
import { ListContainer } from "../../../../lib/components/List";
import NodeChildren from "../../../../lib/components/NodeChildren";

import { SiteTabs } from "../../../../lib/components/SiteTabs";
import { database } from "../../../../lib/data/database";
import {
  getDefaultValue,
  NodeSchema,
  RecordSchema,
  RecordSetSchema,
  ValueSchema,
} from "../../../../lib/data/NodeSchema";
import { digSchemas, parentNodeSchemaQuery, siteNodeQuery } from "../../../../lib/data/SiteNodes";
import { ButtonBar, LinkButton } from "../../../../lib/components/Buttons";
import { SiteDashboardPage } from "../../../../lib/components/SiteDashboardPage";

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
  //   const node = await database.siteNode()

  const nodesQuery = siteNodeQuery(siteName, childKeys);
  if (nodesQuery === null) throw new Error("Unexpectd nullfail");
  const nodes = await database.siteNode.findMany({
    where: nodesQuery,
    include: {
      SiteNode: { select: { id: true, key: true } },
      ...parentNodeSchemaQuery,
    },
  });

  //   const childNodes = await database.siteNode.findMany({
  //     where: { site: siteQuery, parentNode: { id: 1 } },
  //   });
  const node = nodes[0];
  if (!node) {
    return {
      redirect: {
        destination: `/s/${siteName}/dashboard/${childKeys.slice(0, childKeys.length - 1).join("/")}`,
        permanent: false,
      },
    };
  }
  const children = node.SiteNode;

  return {
    props: {
      user: verifiedUser,
      siteName,
      address: childKeys,
      node: {
        value: node.value,
        schema: node.schema,
        parentSchemas: digSchemas(node.parentNode as any),
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
  return <NodeChildren childs={node.children} address={address} siteName={siteName} />;
}

type Node<Schema = NodeSchema> = {
  value: any;
  schema: Schema | null;
  parentSchemas: Schema[];
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
          if (typeof onValueTimeout.current === "number") clearTimeout(onValueTimeout.current);
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
const ArrayItemContainer = styled.div`
  border-left: 2px solid blue;
  background: rgba(240, 240, 255, 0.5);
  padding: 20px;
  margin: 20px 0;
  display: flex;
`;
const ArrayItemChildren = styled.div`
  flex-grow: 1;
`;

function ArrayItem({ children, onRemove }: React.PropsWithChildren<{ onRemove?: () => void }>) {
  return (
    <ArrayItemContainer>
      <ArrayItemChildren>{children}</ArrayItemChildren>
      {onRemove && (
        <Button onClick={onRemove} variant="ghost">
          <CloseIcon />
        </Button>
      )}
    </ArrayItemContainer>
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
        <ArrayItem
          key={index}
          onRemove={
            onValue &&
            (() => {
              const a = [...listValue];
              a.splice(index, 1);
              onValue(a);
            })
          }
        >
          <ValueDisplay
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
        </ArrayItem>
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
      {Object.entries(schema.properties).map(([keyName, v]: [string, any], index: number) => (
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
      ))}
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
    return <TextInputDisplay schema={schema} value={value} onValue={onValue} label={label} />;
  }
  if (schema.type === "number") {
    return <TextInputDisplay schema={schema} value={value} onValue={onValue} label={label} numeric />;
  }
  if (schema.type === "boolean") {
    return <BooleanDisplay schema={schema} value={value} onValue={onValue} label={label} />;
  }
  if (schema.type === "array") {
    return <ArrayDisplay schema={schema} value={value} onValue={onValue} label={label} />;
  }
  if (schema.type === "object") {
    return <ObjectDisplay schema={schema} value={value} onValue={onValue} label={label} />;
  }
  if (value === undefined) return <p>Undefined</p>;
  if (value === null) return <p>Null</p>;
  return <p>{JSON.stringify(value)}</p>;
}

function RecordContent({
  siteName,
  address,
  node,
  contentSchema,
}: {
  siteName: string;
  address: string[];
  node: Node<RecordSchema>;
  contentSchema: ValueSchema;
}) {
  const initValue = node.value === null ? getDefaultValue(contentSchema) : node.value;
  const [savedNodeValue, setSavedNodeValue] = useState(initValue);
  const [nodeValue, setNodeValue] = useState(initValue);
  return (
    <>
      <ValueDisplay
        // label={`${siteName}/${address.join("/")}`}
        label=""
        value={nodeValue}
        schema={contentSchema}
        onValue={(value: any) => {
          setNodeValue(value);
        }}
      />
      {savedNodeValue !== nodeValue && (
        <div>
          <Button
            onClick={() => {
              api("node-put", { siteName, address, value: nodeValue })
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

function useRealValue(siteName: string, address: string[], node: Node) {
  // debugger;
}

function NodeContent({ siteName, address, node }: { siteName: string; address: string[]; node: Node }) {
  const parent = node.parentSchemas[0];
  const a = useRealValue(siteName, address, node);
  if (parent?.type === "record") {
    return <p>Unexpected condition: this node is the child of a record.</p>;
  }
  if (node.schema?.type === "record-set") {
    return <RecordSetContent siteName={siteName} address={address} node={node as Node<RecordSetSchema>} />;
  }
  let schema = node.schema?.type === "record" ? node.schema?.record : undefined;
  if (parent?.type === "record-set" && parent.childRecord) {
    schema = parent.childRecord;
  }
  if (schema === undefined) {
    return <p>Unexpected condition: Schema not found.</p>;
  }
  return (
    <RecordContent siteName={siteName} address={address} node={node as Node<RecordSchema>} contentSchema={schema} />
  );
}

export default function NodeDashboard({
  user,
  siteName,
  address,
  node,
}: {
  user: APIUser;
  siteName: string;
  address: string[];
  node: Node;
}): ReactElement {
  return (
    <SiteDashboardPage user={user} siteName={siteName}>
      <SiteTabs tab="data" siteName={siteName} address={address} nodeType={node.schema?.type} />
      <ButtonBar>
        <LinkButton href={`/s/${siteName}/schema/${address.join("/")}`} icon="pencil-ruler">
          Schema
        </LinkButton>
        <LinkButton href={`/s/${siteName}/history/${address.join("/")}`} icon="history">
          History
        </LinkButton>
        <LinkButton href={`/s/${siteName}/options/${address.join("/")}`} icon="cog">
          Options
        </LinkButton>
      </ButtonBar>
      <MainSection>
        <NodeContent node={node} address={address} siteName={siteName} />
      </MainSection>
    </SiteDashboardPage>
  );
}
