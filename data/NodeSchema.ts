export type ObjectSchema = {
  type: "object";
  properties: Record<string, ValueSchema>;
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
export type ValueSchema =
  | NumberSchema
  | BooleanSchema
  | StringSchema
  | ArraySchema
  | ObjectSchema;
export type SchemaType = ValueSchema["type"];
export type RecordSchema = {
  type: "record";
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
  if (t === "object") return { type: "object", properties: {} };
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
      Object.entries(schema.properties).map(([keyName, keySchema]) => [
        keyName,
        getDefaultValue(keySchema),
      ])
    );
}

export type RecordSetSchema = {
  type: "record-set";
  childRecord?: ValueSchema;
};

export type NodeSchema = RecordSchema | RecordSetSchema;

export type NodeType = NodeSchema["type"];

export function nodeTypeName(n: NodeType): string {
  if (n === "record") return "Node";
  if (n === "record-set") return "Node Set";
  return "?";
}

export const NODE_TYPES: Array<{ key: NodeType; name: string }> = [
  { key: "record", name: "Node" },
  { key: "record-set", name: "Node Set" },
];
