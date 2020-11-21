import {
  Button,
  Divider,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  useDisclosure,
} from "@chakra-ui/core";
import { AddIcon } from "@chakra-ui/icons";
import { GetServerSideProps } from "next";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { api } from "../../../../api-utils/api";
import getVerifiedUser from "../../../../api-utils/getVerifedUser";
import ControlledInput from "../../../../components/ControlledInput";
import { BasicSiteLayout } from "../../../../components/SiteLayout";
import { SiteTabs } from "../../../../components/SiteTabs";
import { database } from "../../../../data/database";
import {
  ArraySchema,
  BooleanSchema,
  DEFAULT_SCHEMA,
  getValueSchema,
  NodeSchema,
  NumberSchema,
  ObjectSchema,
  RecordSchema,
  RecordSetSchema,
  SchemaType,
  StringSchema,
  ValueSchema,
  VALUE_TYPES,
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
    // include: { SiteNode: { select: { id: true, key: true } } },
  });

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

function TypeSelector({
  onValue,
  value = "",
}: {
  onValue: (v: SchemaType) => void;
  value: string;
}) {
  return (
    <Select
      value={value}
      onChange={(e) => {
        onValue(e.target.value as SchemaType);
      }}
    >
      <option value="">Select Type..</option>
      <option value="number">Number</option>
      <option value="boolean">Boolean</option>
      <option value="string">String</option>
      <option value="array">Array</option>
      <option value="object">Object</option>
    </Select>
  );
}

function AddItemButton({
  onAdd,
}: {
  onAdd: (what: "number" | "boolean" | "string") => void;
}) {
  return (
    <>
      <Menu>
        <MenuButton as={Button} variant="ghost">
          <AddIcon />
        </MenuButton>
        <MenuList>
          <MenuItem
            onClick={() => {
              onAdd("number");
            }}
          >
            Number
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAdd("boolean");
            }}
          >
            Boolean
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAdd("string");
            }}
          >
            String
          </MenuItem>
          <MenuItem onClick={() => {}}>Object</MenuItem>
          <MenuItem onClick={() => {}}>Array</MenuItem>
        </MenuList>
      </Menu>
    </>
  );
}

function UntypedSchemaForm({
  onSchema,
}: {
  onSchema: (r: ValueSchema) => void;
}) {
  return (
    <TypeSelector
      value={"number"}
      onValue={(type) => {
        onSchema(getValueSchema(type));
      }}
    />
  );
}

function StringSchemaEdit({
  schema,
  onSchema,
}: {
  schema: StringSchema;
  onSchema: (v: ValueSchema) => void;
}) {
  return <div>String.</div>;
}

function NumberSchemaEdit({
  schema,
  onSchema,
}: {
  schema: NumberSchema;
  onSchema: (v: ValueSchema) => void;
}) {
  return <div>Number.</div>;
}

function BooleanSchemaEdit({
  schema,
  onSchema,
}: {
  schema: BooleanSchema;
  onSchema: (v: ValueSchema) => void;
}) {
  return <div>Boolean.</div>;
}

function NewKeyForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; type: SchemaType }) => void;
}) {
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
      type: "string" as SchemaType,
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ModalBody>
        <FormControl>
          <FormLabel htmlFor="name-input">Name</FormLabel>
          <ControlledInput id="name-input" control={control} name="name" />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="type-select">Type</FormLabel>
          <Controller
            control={control}
            name="type"
            render={({ value, onChange }) => (
              <Select value={value} onChange={onChange} id="type-select">
                {VALUE_TYPES.map(({ key, name }) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </Select>
            )}
          />
        </FormControl>
      </ModalBody>
      <ModalFooter>
        <Button colorScheme="green" type="submit">
          Save
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </ModalFooter>
    </form>
  );
}

function ObjectSchemaEdit({
  schema,
  onSchema,
}: {
  schema: ObjectSchema;
  onSchema: (v: ValueSchema) => void;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <div>Object.</div>
      {Object.entries(schema.properties).map(
        ([key, keySchema]: [string, ValueSchema]) => (
          <div key={key}>
            {key}:{" "}
            <SchemaEdit
              schema={keySchema}
              onSchema={(childSchema) => {
                onSchema({
                  ...schema,
                  properties: {
                    ...schema.properties,
                    [key]: childSchema,
                  },
                });
              }}
            />
          </div>
        )
      )}
      <Button onClick={onOpen}>New Entry</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Object Entry</ModalHeader>
          <ModalCloseButton />
          <NewKeyForm
            onClose={onClose}
            onSubmit={({ name, type }) => {
              onSchema({
                ...schema,
                properties: {
                  ...schema.properties,
                  [name]: getValueSchema(type),
                },
              });
              onClose();
            }}
          />
        </ModalContent>
      </Modal>
    </>
  );
}

function ArraySchemaEdit({
  schema,
  onSchema,
}: {
  schema: ArraySchema;
  onSchema: (v: ValueSchema) => void;
}) {
  return (
    <div>
      Array of:{" "}
      <SchemaEdit
        schema={schema.items}
        onSchema={(items) => {
          onSchema({ ...schema, items });
        }}
      />
    </div>
  );
}

function SchemaEdit({
  schema,
  onSchema,
}: {
  schema: ValueSchema;
  onSchema: (v: ValueSchema) => void;
}) {
  let editor = null;
  if (schema?.type === "string") {
    editor = <StringSchemaEdit schema={schema} onSchema={onSchema} />;
  }
  if (schema?.type === "number") {
    editor = <NumberSchemaEdit schema={schema} onSchema={onSchema} />;
  }
  if (schema?.type === "boolean") {
    editor = <BooleanSchemaEdit schema={schema} onSchema={onSchema} />;
  }
  if (schema?.type === "array") {
    editor = <ArraySchemaEdit schema={schema} onSchema={onSchema} />;
  }
  if (schema?.type === "object") {
    editor = <ObjectSchemaEdit schema={schema} onSchema={onSchema} />;
  }
  return (
    <div>
      {editor}
      <Menu>
        <MenuButton as={Button} variant="ghost">
          Reset Type
        </MenuButton>
        <MenuList>
          <MenuItem
            onClick={() => {
              onSchema({ type: "number" });
            }}
          >
            Number
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSchema({ type: "boolean" });
            }}
          >
            Boolean
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSchema({ type: "string" });
            }}
          >
            String
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSchema({ type: "object", properties: {} });
            }}
          >
            Object
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSchema({ type: "array", items: { type: "string" } });
            }}
          >
            Array
          </MenuItem>
        </MenuList>
      </Menu>
    </div>
  );
}

function RecordForm({
  schema,
  onSchema,
}: {
  schema: RecordSchema;
  onSchema: (r: RecordSchema) => void;
}) {
  const handleRecordSchema = useCallback(
    (record) => {
      onSchema({ ...schema, record });
    },
    [schema]
  );

  return (
    <>
      <SchemaEdit
        schema={schema.record || { type: "object", properties: {} }}
        onSchema={handleRecordSchema}
      />
    </>
  );
}

function RecordSetForm({
  schema,
  onSchema,
}: {
  schema: RecordSetSchema;
  onSchema: (r: RecordSetSchema) => void;
}) {
  return null;
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
  const [schemaState, setSchema] = useState<NodeSchema>(schema);
  const [draftSchema, setDraftSchema] = useState<NodeSchema>(schema);
  return (
    <div>
      <h2>{siteName}</h2>
      {draftSchema.type === "record" ? (
        <RecordForm schema={draftSchema} onSchema={setDraftSchema} />
      ) : (
        <RecordSetForm schema={draftSchema} onSchema={setDraftSchema} />
      )}
      <Divider />
      {draftSchema !== schemaState && (
        <>
          <Button
            onClick={() => {
              api("node-schema-edit", {
                siteName,
                address,
                schema: draftSchema,
              })
                .then(() => {
                  setSchema(draftSchema);
                })
                .catch(console.error);
            }}
            colorScheme="green"
            // disabled={record === schema.record}
          >
            Save Schema
          </Button>
          <Button
            onClick={() => {
              setDraftSchema(schemaState);
            }}
          >
            Cancel
          </Button>
        </>
      )}
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
    schema: NodeSchema;
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
            schema={node.schema}
          />
        </>
      }
    />
  );
}
