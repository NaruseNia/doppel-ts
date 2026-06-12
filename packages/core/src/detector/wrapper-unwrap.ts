import ts from "typescript";
import type { WrapperType } from "../types/component.js";

export interface UnwrapResult {
  innerExpression: ts.Expression;
  wrappers: WrapperType[];
}

export function unwrapExpression(expr: ts.Expression): UnwrapResult {
  const wrappers: WrapperType[] = [];
  let current = expr;

  while (ts.isCallExpression(current)) {
    const wrapper = identifyWrapper(current);
    if (!wrapper) break;
    wrappers.push(wrapper.type);
    current = wrapper.inner;
  }

  return { innerExpression: current, wrappers };
}

function identifyWrapper(
  call: ts.CallExpression,
): { type: WrapperType; inner: ts.Expression } | null {
  const callee = call.expression;

  if (ts.isPropertyAccessExpression(callee)) {
    const name = callee.name.text;
    if (name === "memo" || name === "forwardRef") {
      const arg = call.arguments[0];
      if (arg) return { type: name, inner: arg };
    }
  }

  if (ts.isIdentifier(callee)) {
    const name = callee.text;
    if (name === "memo" || name === "forwardRef") {
      const arg = call.arguments[0];
      if (arg) return { type: name, inner: arg };
    }
    if (name.startsWith("with") && call.arguments.length >= 1) {
      const arg = call.arguments[0];
      if (arg) return { type: { hoc: name }, inner: arg };
    }
  }

  return null;
}
