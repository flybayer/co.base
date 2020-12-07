export type ObjectSchema = {
  type: "object";
  properties: Record<string, ValueSchema>;
  additionalProperties: false;
};

export type NumberSchema = {
  type: "number";
};

export type BooleanSchema = {
  type: "boolean";
};
export type StringSchema = {
  type: "string";
};
export type ArraySchema = {
  type: "array";
  items: ValueSchema;
};
export type ValueSchema = NumberSchema | BooleanSchema | StringSchema | ArraySchema | ObjectSchema;
export type SchemaType = ValueSchema["type"];
export type RecordSchema = {
  type: "record";
  tti?: number;
  record?: ValueSchema;
};

export const DEFAULT_VALUE_SCHEMA: ValueSchema = { type: "string" };

export const DEFAULT_SCHEMA: RecordSchema = {
  type: "record",
  record: { type: "string" },
};

export const VALUE_TYPES: Array<{ name: string; key: SchemaType }> = [
  { name: "Record", key: "object" },
  { name: "List", key: "array" },
  { name: "Text", key: "string" },
  { name: "Number", key: "number" },
  { name: "Switch", key: "boolean" },
];

export function getValueSchema(t: SchemaType): ValueSchema {
  if (t === "array") return { type: "array", items: { type: "string" } };
  if (t === "object") return { type: "object", properties: {}, additionalProperties: false };
  if (t === "string") return { type: "string" };
  if (t === "boolean") return { type: "boolean" };
  if (t === "number") return { type: "number" };
  throw new Error("Uknown vnaaluwelc hew");
}

export function getDefaultValue(schema: ValueSchema): any {
  if (schema.type === "string") return "";
  if (schema.type === "number") return 0;
  if (schema.type === "boolean") return false;
  if (schema.type === "array") return [];
  if (schema.type === "object")
    return Object.fromEntries(
      Object.entries(schema.properties).map(([keyName, keySchema]) => [keyName, getDefaultValue(keySchema)]),
    );
}

export type RecordSetSchema = {
  type: "record-set";
  childRecord?: ValueSchema;
};
export type FolderSchema = {
  type: "folder";
};

export type NodeSchema = FolderSchema | RecordSchema | RecordSetSchema;

export type NodeType = NodeSchema["type"];

export function nodeTypeName(n: NodeType): string {
  if (n === "record") return "Record";
  if (n === "record-set") return "Record Set";
  if (n === "folder") return "Folder";
  return "?";
}

export const NODE_TYPES: Array<{
  key: NodeType;
  name: string;
  hidden: boolean;
}> = [
  { key: "record", name: "Record", hidden: false },
  { key: "record-set", name: "Record Set", hidden: false },
  { key: "folder", name: "Folder", hidden: false },
];
