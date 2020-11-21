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

export const DEFAULT_SCHEMA = { type: "record" };

export const VALUE_TYPES: Array<{ name: string; key: SchemaType }> = [
  { name: "Object", key: "object" },
  { name: "Array", key: "array" },
  { name: "String", key: "string" },
  { name: "Number", key: "number" },
  { name: "Boolean", key: "boolean" },
];

export function getValueSchema(t: SchemaType): ValueSchema {
  if (t === "array") return { type: "array", items: { type: "string" } };
  if (t === "object") return { type: "object", properties: {} };
  if (t === "string") return { type: "string" };
  if (t === "boolean") return { type: "boolean" };
  if (t === "number") return { type: "number" };
  throw new Error("Uknown vnaaluwelc hew");
}

export type RecordSetSchema = {
  type: "record-set";
  childRecord?: ValueSchema;
};

export type NodeSchema = RecordSchema | RecordSetSchema;

export type NodeType = NodeSchema["type"];

export function nodeTypeName(n: NodeType): string {
  if (n === "record") return "Record";
  if (n === "record-set") return "Record Set";
  return "?";
}

export const NODE_TYPES: Array<{ key: NodeType; name: string }> = [
  { key: "record", name: "Record" },
  { key: "record-set", name: "Record Set" },
];
