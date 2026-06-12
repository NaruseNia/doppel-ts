import ts from "typescript";
import type { ComponentInfo } from "../types/component.js";
import { unwrapExpression } from "./wrapper-unwrap.js";

export function detectFunctionComponents(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ComponentInfo[] {
  const components: ComponentInfo[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement)) {
      const result = tryExtractFromExpression(statement.expression, sourceFile, checker, "default");
      if (result) components.push(result);
      continue;
    }

    if (!hasExportModifier(statement)) continue;

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      if (returnsJSX(statement, checker)) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(statement.getStart());
        components.push({
          name: statement.name.text,
          filePath: sourceFile.fileName,
          line: line + 1,
          column: character,
          exportType: hasDefaultModifier(statement) ? "default" : "named",
          wrappers: [],
          isLocal: false,
        });
      }
    }

    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;

        const result = tryExtractFromExpression(
          decl.initializer,
          sourceFile,
          checker,
          "named",
          decl.name.text,
          decl,
        );
        if (result) components.push(result);
      }
    }
  }

  return components;
}

function tryExtractFromExpression(
  expr: ts.Expression,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  exportType: "named" | "default",
  explicitName?: string,
  posNode?: ts.Node,
): ComponentInfo | null {
  const { innerExpression, wrappers } = unwrapExpression(expr);

  const fn = extractFunction(innerExpression);
  if (fn) {
    if (!returnsJSX(fn, checker)) return null;
    const name = explicitName ?? getFunctionName(fn) ?? "default";
    const node = posNode ?? fn;
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return {
      name,
      filePath: sourceFile.fileName,
      line: line + 1,
      column: character,
      exportType,
      wrappers,
      isLocal: false,
    };
  }

  if (ts.isIdentifier(innerExpression)) {
    const resolved = resolveIdentifier(innerExpression, checker);
    if (resolved && returnsJSX(resolved, checker)) {
      const name = explicitName ?? innerExpression.text;
      const node = posNode ?? innerExpression;
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      return {
        name,
        filePath: sourceFile.fileName,
        line: line + 1,
        column: character,
        exportType,
        wrappers,
        isLocal: false,
      };
    }
  }

  if (wrappers.length > 0) {
    const name = explicitName ?? "default";
    const node = posNode ?? expr;
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return {
      name,
      filePath: sourceFile.fileName,
      line: line + 1,
      column: character,
      exportType,
      wrappers,
      isLocal: false,
    };
  }

  return null;
}

function resolveIdentifier(
  id: ts.Identifier,
  checker: ts.TypeChecker,
): ts.FunctionLikeDeclaration | null {
  const symbol = checker.getSymbolAtLocation(id);
  if (!symbol) return null;
  const decls = symbol.getDeclarations();
  if (!decls) return null;
  for (const decl of decls) {
    if (ts.isFunctionDeclaration(decl)) return decl;
    if (ts.isVariableDeclaration(decl) && decl.initializer) {
      const fn = extractFunction(decl.initializer);
      if (fn) return fn;
    }
  }
  return null;
}

function extractFunction(expr: ts.Expression): ts.FunctionLikeDeclaration | null {
  if (ts.isFunctionExpression(expr) || ts.isArrowFunction(expr)) return expr;
  if (ts.isParenthesizedExpression(expr)) return extractFunction(expr.expression);
  return null;
}

function getFunctionName(fn: ts.FunctionLikeDeclaration): string | undefined {
  if (ts.isFunctionExpression(fn) && fn.name) return fn.name.text;
  return undefined;
}

function returnsJSX(fn: ts.FunctionLikeDeclaration, _checker: ts.TypeChecker): boolean {
  let found = false;
  function visit(node: ts.Node) {
    if (found) return;
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  }
  if (fn.body) visit(fn.body);
  return found;
}

function hasExportModifier(node: ts.Statement): boolean {
  return ts.canHaveModifiers(node)
    ? (ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false)
    : false;
}

function hasDefaultModifier(node: ts.Statement): boolean {
  return ts.canHaveModifiers(node)
    ? (ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) ?? false)
    : false;
}
