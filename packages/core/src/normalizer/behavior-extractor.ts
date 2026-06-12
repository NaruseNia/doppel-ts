import ts from "typescript";
import type { ComponentInfo } from "../types/component.js";
import type { NormalizedBehaviorInfo } from "./types.js";

const REACT_HOOKS = new Set([
  "useState",
  "useEffect",
  "useCallback",
  "useMemo",
  "useRef",
  "useContext",
  "useReducer",
  "useLayoutEffect",
  "useImperativeHandle",
  "useDebugValue",
  "useDeferredValue",
  "useTransition",
  "useId",
  "useSyncExternalStore",
  "useInsertionEffect",
]);

export function extractBehaviorInfo(
  component: ComponentInfo,
  program: ts.Program,
): NormalizedBehaviorInfo | undefined {
  const sourceFile = program.getSourceFile(component.filePath);
  if (!sourceFile) return undefined;

  const hooks: { name: string; depsCount?: number }[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const name = getHookName(node);
      if (name) {
        hooks.push({
          name,
          depsCount: getDepsCount(name, node),
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  const fn = findComponentBody(sourceFile, component);
  if (fn) visit(fn);

  if (hooks.length === 0) return undefined;
  return { hooks };
}

function getHookName(call: ts.CallExpression): string | null {
  const expr = call.expression;
  if (ts.isIdentifier(expr) && REACT_HOOKS.has(expr.text)) {
    return expr.text;
  }
  if (ts.isPropertyAccessExpression(expr) && REACT_HOOKS.has(expr.name.text)) {
    return expr.name.text;
  }
  if (ts.isIdentifier(expr) && expr.text.startsWith("use") && expr.text.length > 3) {
    return expr.text;
  }
  return null;
}

function getDepsCount(hookName: string, call: ts.CallExpression): number | undefined {
  const hooksWithDeps = new Set([
    "useEffect",
    "useCallback",
    "useMemo",
    "useLayoutEffect",
    "useInsertionEffect",
  ]);
  if (!hooksWithDeps.has(hookName)) return undefined;

  const depsArg = call.arguments[1];
  if (depsArg && ts.isArrayLiteralExpression(depsArg)) {
    return depsArg.elements.length;
  }
  return undefined;
}

function findComponentBody(sourceFile: ts.SourceFile, component: ComponentInfo): ts.Node | null {
  for (const stmt of sourceFile.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name?.text === component.name) {
      return stmt.body ?? null;
    }
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === component.name && decl.initializer) {
          return unwrapBody(decl.initializer);
        }
      }
    }
  }
  return null;
}

function unwrapBody(expr: ts.Expression): ts.Node | null {
  if (ts.isFunctionExpression(expr) || ts.isArrowFunction(expr)) return expr.body;
  if (ts.isCallExpression(expr)) {
    for (const arg of expr.arguments) {
      const result = unwrapBody(arg);
      if (result) return result;
    }
  }
  if (ts.isParenthesizedExpression(expr)) return unwrapBody(expr.expression);
  return null;
}
