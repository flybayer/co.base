import * as Logic from "../Logic";

test("number basic type", () => {
  const n0 = Logic.Number({
    description: "on state",
    literalValue: 1,
  });
  expect(n0).toMatchObject({
    type: "LogicNumber",
    literalValue: 1,
    description: "on state",
  });
  expect(Logic.toJS(n0)).toEqual("1");
});

test("boolean basic type", () => {
  const b0 = Logic.Boolean({
    description: "a toggle",
    literalValue: false,
  });
  expect(b0).toMatchObject({
    type: "LogicBoolean",
    literalValue: false,
    description: "a toggle",
  });
  const b1 = Logic.Boolean({
    description: "a toggle",
  });
  expect(b1).toMatchObject({
    type: "LogicBoolean",
    literalValue: undefined,
    description: "a toggle",
  });
  expect(Logic.toJS(b0)).toEqual("false");
});

test("match a number type", () => {
  const n0 = Logic.Number({
    description: "on state",
  });
  expect(Logic.getTypeErrors(n0, 111)).toEqual(undefined);
  expect(Logic.getTypeErrors(n0, "11")?.length).toEqual(1);
  const n1 = Logic.Number({
    description: "on state",
    literalValue: 2,
  });
  expect(Logic.getTypeErrors(n1, 2)).toEqual(undefined);
  const e1 = Logic.getTypeErrors(n1, 3);
  expect(e1?.length).toEqual(1);
  const e1e = e1 && e1[0];
  expect(e1e?.errorName).toEqual("LiteralValueMismatch");
});

test("records", () => {
  const r0 = Logic.Record({
    description: "the first ever logic record",
    fields: {
      n: Logic.Number({}),
      b: Logic.Boolean({}),
    },
  });
  expect(r0).toMatchObject({
    type: "LogicRecord",
    description: "the first ever logic record",
    fields: {
      n: { type: "LogicNumber" },
      b: { type: "LogicBoolean" },
    },
  });
  const e0 = Logic.getTypeErrors(r0, {
    b: true,
    n: true,
  });
  expect(e0 && e0.length).toEqual(1);
  const e0e = e0 && e0[0];
  expect(e0e && e0e.errorName).toEqual("RecordFieldInvalid");
  expect(
    e0e && e0e.child && !Array.isArray(e0e.child) && e0e.child.errorName
  ).toEqual("InvalidPrimitive");
  const e1 = Logic.getTypeErrors(r0, 12);
  const e1e = e1 && e1[0];
  expect(e1 && e1.length).toEqual(1);
  expect(e1e && e1e.errorName).toEqual("RecordRequiresObject");
});

test("records extra fields", () => {
  const r0 = Logic.Record({
    fields: {
      n: Logic.Number({}),
      b: Logic.Boolean({}),
    },
  });
  const e0 = Logic.getTypeErrors(r0, {
    b: true,
    n: 12,
    what: 12,
    doesNotBelong: true,
  });
  const e0e = e0 && e0[0];
  expect(e0?.length).toEqual(1);
  expect(e0e?.errorName).toEqual("RecordUnknownFields");
  expect(e0e?.invalidArgs?.length).toEqual(2);
});

test("context can save values", () => {
  const ctx = Logic.createContext();
  Logic.define(ctx, "a", 123);
  expect(Logic.get(ctx, "a")).toEqual(123);
});

test("types can be defined in context, and respected", () => {
  const ctx = Logic.createContext();
  Logic.defineTyped(ctx, "a", 123, Logic.Number({}));
  expect(Logic.get(ctx, "a")).toEqual(123);
  expect(Logic.getType(ctx, "a").type).toEqual("LogicNumber");
  expect(() => Logic.define(ctx, "a", true)).toThrow();
});

test("assignment statement is serialized properly to JS and JSON", () => {
  const a0 = Logic.AssignmentStatement({
    ref: "varA",
    value: Logic.Number({ literalValue: 2 }),
  });
  expect(a0).toMatchSnapshot();
  expect(Logic.toJS(a0)).toEqual("varA = 2;");
});

test("multiplication expression serializes", () => {
  const m0 = Logic.MultiplyExpression({
    description: "times, this!",
    terms: [
      Logic.Number({ literalValue: 3 }),
      Logic.Number({ literalValue: 5 }),
    ],
  });
  expect(m0).toMatchSnapshot();
  expect(Logic.toJS(m0)).toEqual("(3 * 5)");
  const ctx = Logic.createBlockContext();
  expect(Logic.evaluate(m0, ctx)).toEqual(15);
});

test("variable ref is serialized properly to JS and JSON", () => {
  const r0 = Logic.Ref({ name: "varA" });
  expect(r0).toMatchSnapshot();
  expect(Logic.toJS(r0)).toEqual("varA");
});

test("ref evaluation respects the context", () => {
  const secretA = {};
  const ctx = Logic.createBlockContext();
  ctx.set("varA", secretA);
  const r0 = Logic.Ref({ name: "varA" });
  const result = Logic.evaluate(r0, ctx);
  expect(result).toBe(secretA);
});

test("a function that takes and returns a number", () => {
  const doubleFn = Logic.Function({
    input: Logic.Number({}),
    statements: [
      Logic.AssignmentStatement({
        ref: "multiplied",
        value: Logic.MultiplyExpression({
          terms: [
            Logic.Number({ literalValue: 2 }), // todo, literal 2 should work here as well
            Logic.Ref({ name: "input" }),
          ],
        }),
      }),
    ],
    output: Logic.Ref({ name: "multiplied" }),
  });
  expect(doubleFn).toMatchSnapshot();
  expect(Logic.toJS(doubleFn)).toEqual(
    "((input) => { let multiplied; multiplied = (2 * input); return multiplied; })"
  );
  const threeByTwo = Logic.Call({
    fun: doubleFn,
    input: Logic.Number({ literalValue: 3 }),
  });
  expect(threeByTwo).toMatchSnapshot();
  const ctx = Logic.createBlockContext();
  expect(Logic.evaluate(threeByTwo, ctx)).toEqual(6);
});
