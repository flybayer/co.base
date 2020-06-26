type LogicName = string;

type LogicContext = {
  value: {
    [a in LogicName]: any;
  };
  type: {
    [a in LogicName]: any;
  };
};

type LogicBlockContext = {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
};
export function createBlockContext(): LogicBlockContext {
  const values: {
    [k in string]: any;
  } = {};
  return {
    get: (key: string) => values[key],
    set: (key: string, val: any) => {
      values[key] = val;
    },
  };
}

export function createContext(): LogicContext {
  return {
    value: {},
    type: {},
  };
}
class LError extends Error {
  constructor(message: string, info?: any) {
    super(message);
    this.info = info;
  }
  info?: any;
}
export function define(
  context: LogicContext,
  name: LogicName,
  value: any
): void {
  if (context.type[name]) {
    const typeErrors = getTypeErrors(context.type[name], value);
    if (typeErrors) {
      throw new LError("Type Errors", typeErrors);
    }
  }
  context.value[name] = value;
}

export function defineTyped(
  context: LogicContext,
  name: LogicName,
  value: any,
  type: LogicJSON
) {
  const typeErrors = getTypeErrors(type, value);
  if (typeErrors) {
    throw new LError("Type Errors", typeErrors);
  }
  context.type[name] = type;
  context.value[name] = value;
}

export function get(context: LogicContext, name: LogicName): any {
  return context.value[name];
}

export function getType(context: LogicContext, name: LogicName): any {
  return context.type[name];
}

type LogicTypeError = {
  message: string;
  errorName: string;
  invalidArgs?: Array<string>;
  expectedArgs?: Array<string>;
  child?: LogicTypeError | Array<LogicTypeError>;
};

type LogicType<JSONType, LogicTypeOptions> = {
  create: (options: LogicTypeOptions) => JSONType;
  toJS: (logic: JSONType) => string;
  getTypeErrors: (
    logic: JSONType,
    value: any
  ) => undefined | Array<LogicTypeError>;
  evaluate: (logic: JSONType, context: LogicBlockContext) => any;
};

// Number:

type LogicBooleanOptions = { description?: string; literalValue?: boolean };
type LogicBooleanJSON = {
  type: "LogicBoolean";
  literalValue?: boolean;
  description?: string;
};

export const LogicBoolean: LogicType<LogicBooleanJSON, LogicBooleanOptions> = {
  create({ description, literalValue }: LogicBooleanOptions = {}) {
    return { type: "LogicBoolean", literalValue, description };
  },
  toJS({ literalValue }: LogicBooleanJSON) {
    return String(literalValue);
  },
  getTypeErrors(
    logic: LogicBooleanJSON,
    value: any
  ): undefined | Array<LogicTypeError> {
    if (typeof value !== "boolean") {
      return [
        {
          message: `expected a boolean but got a ${typeof value}`,
          errorName: "InvalidPrimitive",
          expectedArgs: ["boolean"],
          invalidArgs: [typeof value],
        },
      ];
    }
    if (logic.literalValue !== undefined && value !== logic.literalValue) {
      return [
        {
          message: `Expected ${logic.literalValue}, but received ${value} `,
          errorName: "LiteralValueMismatch",
          expectedArgs: [String(logic.literalValue)],
          invalidArgs: [String(value)],
        },
      ];
    }
    return undefined;
  },
  evaluate(logic: LogicBooleanJSON) {
    return logic.literalValue;
  },
};

// Number:

type LogicNumberOptions = { description?: string; literalValue?: number };
type LogicNumberJSON = {
  type: "LogicNumber";
  literalValue?: number | undefined;
  description?: string;
};

export const LogicNumber: LogicType<LogicNumberJSON, LogicNumberOptions> = {
  create({ description, literalValue }: LogicNumberOptions = {}) {
    return { type: "LogicNumber", literalValue, description };
  },
  toJS({ literalValue }: LogicNumberJSON) {
    return String(literalValue);
  },
  getTypeErrors(
    logic: LogicNumberJSON,
    value: any
  ): undefined | Array<LogicTypeError> {
    if (typeof value !== "number") {
      return [
        {
          message: `Expected a number, but got a ${typeof value}`,
          errorName: "InvalidPrimitive",
          expectedArgs: ["number"],
          invalidArgs: [typeof value],
        },
      ];
    }
    if (logic.literalValue !== undefined && value !== logic.literalValue) {
      return [
        {
          message: `Expected ${logic.literalValue}, but received ${value} `,
          errorName: "LiteralValueMismatch",
          expectedArgs: [String(logic.literalValue)],
          invalidArgs: [String(value)],
        },
      ];
    }
    return undefined;
  },
  evaluate(logic: LogicNumberJSON) {
    return logic.literalValue;
  },
};

// Record

type LogicRecordOptions = { description?: string; fields: any };
type LogicRecordJSON = {
  type: "LogicRecord";
  fields: { [A in string]: LogicJSON };
};

export const LogicRecord: LogicType<LogicRecordJSON, LogicRecordOptions> = {
  create({ description, fields }: LogicRecordOptions) {
    return { type: "LogicRecord", fields, description };
  },
  toJS({ fields }: LogicRecordJSON) {
    // return String(value);
    return "";
  },
  getTypeErrors(
    logic: LogicRecordJSON,
    value: any
  ): undefined | Array<LogicTypeError> {
    const errors: Array<LogicTypeError> = [];
    if (typeof value !== "object") {
      return [
        {
          message: `Cannot validate a ${typeof value} as a record. It must be an object`,
          errorName: "RecordRequiresObject",
        },
      ];
    }
    const extraProvidedFields = new Set(Object.keys(value));
    Object.entries(logic.fields).forEach(([fieldName, childLogic]) => {
      extraProvidedFields.delete(fieldName);
      const child = value[fieldName];
      const childErrors = getTypeErrors(childLogic, child);
      if (childErrors)
        childErrors.forEach((childErr: LogicTypeError) => {
          errors.push({
            errorName: "RecordFieldInvalid",
            message: `Error in "${fieldName}" field: ${childErr.message}`,
            child: childErr,
          });
        });
    });
    if (extraProvidedFields.size !== 0) {
      errors.push({
        message: `Unknown fields "${Array.from(extraProvidedFields).join(
          '", "'
        )}"`,
        errorName: "RecordUnknownFields",
        invalidArgs: Array.from(extraProvidedFields),
      });
    }
    if (errors.length === 0) return undefined;
    return errors;
  },
  evaluate(logic: LogicRecordJSON, context: LogicBlockContext) {
    return {
      // coming soon
    };
  },
};

// AssignmentStatement

type LogicAssignmentStatementOptions = {
  description?: string;
  ref: string;
  value: LogicJSON;
};
type LogicAssignmentStatementJSON = {
  type: "LogicAssignmentStatement";
  ref: string;
  value: LogicJSON;
  description?: string;
};

export const LogicAssignmentStatement: LogicType<
  LogicAssignmentStatementJSON,
  LogicAssignmentStatementOptions
> = {
  create({ description, ref, value }: LogicAssignmentStatementOptions) {
    return { type: "LogicAssignmentStatement", description, ref, value };
  },
  toJS({ ref, value }: LogicAssignmentStatementJSON) {
    return `${ref} = ${toJS(value)};`;
  },
  getTypeErrors(
    logic: LogicAssignmentStatementJSON,
    value: any
  ): undefined | Array<LogicTypeError> {
    return undefined;
  },
  evaluate(
    { ref, value }: LogicAssignmentStatementJSON,
    context: LogicBlockContext
  ) {
    const evaluatedValue = evaluate(value, context);
    context.set(ref, evaluatedValue);
    return evaluatedValue;
  },
};

// MultiplyExpression

type LogicMultiplyExpressionOptions = {
  description?: string;
  terms: Array<LogicJSON>;
};
type LogicMultiplyExpressionJSON = {
  type: "LogicMultiplyExpression";
  terms: Array<LogicJSON>;
  description?: string;
};

export const LogicMultiplyExpression: LogicType<
  LogicMultiplyExpressionJSON,
  LogicMultiplyExpressionOptions
> = {
  create({ description, terms }: LogicMultiplyExpressionOptions) {
    return { type: "LogicMultiplyExpression", description, terms };
  },
  toJS({ terms }: LogicMultiplyExpressionJSON) {
    return `(${terms.map((logicTerm) => toJS(logicTerm)).join(" * ")})`;
  },
  getTypeErrors(
    logic: LogicMultiplyExpressionJSON,
    value: any
  ): undefined | Array<LogicTypeError> {
    return undefined;
  },
  evaluate(logic: LogicMultiplyExpressionJSON, context: LogicBlockContext) {
    return logic.terms
      .map((logicTerm) => {
        const result = evaluate(logicTerm, context);
        return result;
      })
      .reduce((last, current, i) => {
        return last * current;
      }, 1);
  },
};

// Ref

type LogicRefOptions = { description?: string; name: string };
type LogicRefJSON = {
  type: "LogicRef";
  name: string;
  description?: string;
};

export const LogicRef: LogicType<LogicRefJSON, LogicRefOptions> = {
  create({ name, description }: LogicRefOptions) {
    return { type: "LogicRef", name, description };
  },
  toJS({ name }: LogicRefJSON) {
    return String(name);
  },
  getTypeErrors(
    logic: LogicRefJSON,
    value: any
  ): undefined | Array<LogicTypeError> {
    return undefined;
  },
  evaluate({ name }: LogicRefJSON, context: LogicBlockContext) {
    return context.get(name);
  },
};

// Function

type LogicFunctionOptions = {
  description?: string;
  input: LogicJSON;
  statements: Array<LogicJSON>;
  output: LogicJSON;
};
type LogicFunctionJSON = {
  type: "LogicFunction";
  description?: string;
  input: LogicJSON;
  statements: Array<LogicJSON>;
  output: LogicJSON;
};

export const LogicFunction: LogicType<
  LogicFunctionJSON,
  LogicFunctionOptions
> = {
  create({ description, input, statements, output }: LogicFunctionOptions) {
    return { type: "LogicFunction", description, input, statements, output };
  },
  toJS({ description, input, statements, output }: LogicFunctionJSON) {
    let header = "";
    const detectedLocalVars = new Set<string>();
    let body = statements
      .map((stmt) => {
        if (stmt.type === "LogicAssignmentStatement") {
          detectedLocalVars.add(stmt.ref);
        }
        return toJS(stmt);
      })
      .join(" ");
    detectedLocalVars.forEach((varName) => {
      header += `let ${varName}; `;
    });
    body += ` return ${toJS(output)};`;
    return `((input) => { ${header}${body} })`;
  },
  getTypeErrors(
    logic: LogicFunctionJSON,
    value: any
  ): undefined | Array<LogicTypeError> {
    return undefined;
  },
  evaluate(
    { input, statements, output }: LogicFunctionJSON,
    context: LogicBlockContext
  ) {
    return (inputValue: any) => {
      const fnContext = createBlockContext(); // this should theoretically extend `context`
      fnContext.set("input", inputValue);
      statements.forEach((stmt) => {
        evaluate(stmt, fnContext);
      });
      return evaluate(output, fnContext);
    };
  },
};

// Call

type LogicCallOptions = {
  description?: string;
  fun: LogicJSON;
  input: LogicJSON;
};
type LogicCallJSON = {
  type: "LogicCall";
  description?: string;
  fun: LogicJSON; // probably a Function, a Ref, or another Call
  input: LogicJSON;
};

export const LogicCall: LogicType<LogicCallJSON, LogicCallOptions> = {
  create({ description, fun, input }: LogicCallOptions) {
    return { type: "LogicCall", description, fun, input };
  },
  toJS({ description }: LogicCallJSON) {
    // return String(name);
    return "";
  },
  getTypeErrors(
    logic: LogicCallJSON,
    value: any
  ): undefined | Array<LogicTypeError> {
    return undefined;
  },
  evaluate({ input, fun }: LogicCallJSON, context: LogicBlockContext) {
    const inputValue = evaluate(input, context);
    return evaluate(fun, context)(inputValue);
  },
};

// Type Summary/Rollup

type LogicJSON =
  | LogicNumberJSON
  | LogicBooleanJSON
  | LogicRecordJSON
  | LogicRefJSON
  | LogicAssignmentStatementJSON
  | LogicMultiplyExpressionJSON
  | LogicFunctionJSON
  | LogicCallJSON;

export const Number = LogicNumber.create;
export const Boolean = LogicBoolean.create;
export const Record = LogicRecord.create;
export const Ref = LogicRef.create;
export const AssignmentStatement = LogicAssignmentStatement.create;
export const MultiplyExpression = LogicMultiplyExpression.create;
export const Function = LogicFunction.create;
export const Call = LogicCall.create;

// Top-Level API

export function toJS(logic: LogicJSON) {
  if (logic.type === "LogicBoolean") {
    return LogicBoolean.toJS(logic);
  } else if (logic.type === "LogicNumber") {
    return LogicNumber.toJS(logic);
  } else if (logic.type === "LogicRecord") {
    return LogicRecord.toJS(logic);
  } else if (logic.type === "LogicRef") {
    return LogicRef.toJS(logic);
  } else if (logic.type === "LogicAssignmentStatement") {
    return LogicAssignmentStatement.toJS(logic);
  } else if (logic.type === "LogicMultiplyExpression") {
    return LogicMultiplyExpression.toJS(logic);
  } else if (logic.type === "LogicFunction") {
    return LogicFunction.toJS(logic);
  } else if (logic.type === "LogicCall") {
    return LogicCall.toJS(logic);
  } else {
    throw new Error("Unrecognized Logic");
  }
}

export function getTypeErrors(logic: LogicJSON, value: any) {
  if (logic.type === "LogicBoolean") {
    return LogicBoolean.getTypeErrors(logic, value);
  } else if (logic.type === "LogicNumber") {
    return LogicNumber.getTypeErrors(logic, value);
  } else if (logic.type === "LogicRecord") {
    return LogicRecord.getTypeErrors(logic, value);
  } else if (logic.type === "LogicRef") {
    return LogicRef.getTypeErrors(logic, value);
  } else if (logic.type === "LogicAssignmentStatement") {
    return LogicAssignmentStatement.getTypeErrors(logic, value);
  } else if (logic.type === "LogicMultiplyExpression") {
    return LogicMultiplyExpression.getTypeErrors(logic, value);
  } else if (logic.type === "LogicFunction") {
    return LogicFunction.getTypeErrors(logic, value);
  } else if (logic.type === "LogicCall") {
    return LogicCall.getTypeErrors(logic, value);
  } else {
    throw new Error("Unrecognized Logic");
  }
}

export function evaluate(logic: LogicJSON, context: LogicBlockContext) {
  if (logic.type === "LogicBoolean") {
    return LogicBoolean.evaluate(logic, context);
  } else if (logic.type === "LogicNumber") {
    return LogicNumber.evaluate(logic, context);
  } else if (logic.type === "LogicRecord") {
    return LogicRecord.evaluate(logic, context);
  } else if (logic.type === "LogicRef") {
    return LogicRef.evaluate(logic, context);
  } else if (logic.type === "LogicAssignmentStatement") {
    return LogicAssignmentStatement.evaluate(logic, context);
  } else if (logic.type === "LogicMultiplyExpression") {
    return LogicMultiplyExpression.evaluate(logic, context);
  } else if (logic.type === "LogicFunction") {
    return LogicFunction.evaluate(logic, context);
  } else if (logic.type === "LogicCall") {
    return LogicCall.evaluate(logic, context);
  } else {
    throw new Error("Unrecognized Logic");
  }
}
