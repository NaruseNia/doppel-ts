import ts from "typescript";
import type { TypeDescriptor, PropProperty } from "../types/props.js";

const MAX_DEPTH = 10;

export function resolveTypeDescriptor(
  type: ts.Type,
  checker: ts.TypeChecker,
  depth = 0,
): TypeDescriptor {
  if (depth > MAX_DEPTH) return { kind: "reference", name: "unknown" };

  if (type.isUnion()) {
    const members = type.types.map((t) => resolveTypeDescriptor(t, checker, depth + 1));
    if (members.length === 1) return members[0];
    return { kind: "union", members };
  }

  if (type.isIntersection()) {
    const members = type.types.map((t) => resolveTypeDescriptor(t, checker, depth + 1));
    return { kind: "intersection", members };
  }

  if (type.isStringLiteral()) return { kind: "literal", value: `"${type.value}"` };
  if (type.isNumberLiteral()) return { kind: "literal", value: String(type.value) };
  if (type.getFlags() & ts.TypeFlags.BooleanLiteral) {
    return { kind: "literal", value: (type as ts.IntrinsicType).intrinsicName };
  }

  const typeStr = checker.typeToString(type);

  if (type.getFlags() & ts.TypeFlags.String) return { kind: "primitive", name: "string" };
  if (type.getFlags() & ts.TypeFlags.Number) return { kind: "primitive", name: "number" };
  if (type.getFlags() & ts.TypeFlags.Boolean) return { kind: "primitive", name: "boolean" };
  if (type.getFlags() & ts.TypeFlags.Void) return { kind: "primitive", name: "void" };
  if (type.getFlags() & ts.TypeFlags.Undefined) return { kind: "primitive", name: "undefined" };
  if (type.getFlags() & ts.TypeFlags.Null) return { kind: "primitive", name: "null" };
  if (type.getFlags() & ts.TypeFlags.Any) return { kind: "primitive", name: "any" };
  if (type.getFlags() & ts.TypeFlags.Never) return { kind: "primitive", name: "never" };

  if (checker.isArrayType(type)) {
    const typeArgs = (type as ts.TypeReference).typeArguments;
    if (typeArgs?.[0]) {
      return {
        kind: "array",
        element: resolveTypeDescriptor(typeArgs[0], checker, depth + 1),
      };
    }
    return { kind: "array", element: { kind: "primitive", name: "unknown" } };
  }

  const callSignatures = type.getCallSignatures();
  if (callSignatures.length > 0) {
    const sig = callSignatures[0];
    const params = sig.getParameters().map((p) => {
      const paramType = checker.getTypeOfSymbol(p);
      return resolveTypeDescriptor(paramType, checker, depth + 1);
    });
    const returnType = resolveTypeDescriptor(sig.getReturnType(), checker, depth + 1);
    return { kind: "function", params, returnType };
  }

  const properties = type.getProperties();
  if (
    properties.length > 0 &&
    !(type.getFlags() & ts.TypeFlags.Object && typeStr.match(/^[A-Z]/))
  ) {
    const props = resolveProperties(properties, type, checker, depth + 1);
    if (props.length > 0) return { kind: "object", properties: props };
  }

  return { kind: "reference", name: typeStr };
}

export function resolveProperties(
  symbols: ts.Symbol[],
  parentType: ts.Type,
  checker: ts.TypeChecker,
  depth = 0,
): PropProperty[] {
  return symbols
    .filter((s) => !(s.getFlags() & ts.SymbolFlags.Method && s.getName() === "render"))
    .map((symbol) => {
      const propType =
        checker.getTypeOfPropertyOfType(parentType, symbol.getName()) ??
        checker.getTypeOfSymbol(symbol);
      const optional = (symbol.getFlags() & ts.SymbolFlags.Optional) !== 0;

      return {
        name: symbol.getName(),
        type: resolveTypeDescriptor(propType, checker, depth),
        optional,
      };
    });
}
