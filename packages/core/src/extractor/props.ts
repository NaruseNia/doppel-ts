import ts from "typescript";
import type { ComponentInfo } from "../types/component.js";
import type { PropsInfo } from "../types/props.js";
import { resolveProperties } from "./type-resolver.js";

export function extractProps(
  component: ComponentInfo,
  program: ts.Program,
  checker: ts.TypeChecker,
): PropsInfo {
  const sourceFile = program.getSourceFile(component.filePath);
  if (!sourceFile) return emptyProps();

  const fn = findComponentFunction(sourceFile, component, checker);
  if (!fn) return emptyProps();

  const propsType = getPropsType(fn, checker);
  if (!propsType) return emptyProps();

  const properties = resolveProperties(propsType.getProperties(), propsType, checker);

  const hasChildren = properties.some((p) => p.name === "children");
  const hasRef = component.wrappers.includes("forwardRef");

  return { properties, hasChildren, hasRef };
}

function getPropsType(fn: ts.SignatureDeclarationBase, checker: ts.TypeChecker): ts.Type | null {
  const sig = checker.getSignatureFromDeclaration(fn);
  if (!sig) return null;

  const params = sig.getParameters();
  if (params.length === 0) return null;

  return checker.getTypeOfSymbol(params[0]);
}

function findComponentFunction(
  sourceFile: ts.SourceFile,
  component: ComponentInfo,
  checker: ts.TypeChecker,
): ts.SignatureDeclarationBase | null {
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === component.name) {
      return statement;
    }

    if (ts.isClassDeclaration(statement) && statement.name?.text === component.name) {
      return extractClassPropsSignature(statement, checker);
    }

    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === component.name && decl.initializer) {
          const fn = unwrapToFunction(decl.initializer);
          if (fn) return fn;
        }
      }
    }

    if (ts.isExportAssignment(statement)) {
      if (ts.isIdentifier(statement.expression) && statement.expression.text === component.name) {
        const symbol = checker.getSymbolAtLocation(statement.expression);
        if (symbol) {
          const decls = symbol.getDeclarations();
          if (decls) {
            for (const d of decls) {
              if (ts.isFunctionDeclaration(d)) return d;
              if (ts.isVariableDeclaration(d) && d.initializer) {
                const fn = unwrapToFunction(d.initializer, checker);
                if (fn) return fn;
              }
            }
          }
        }
      }
    }
  }
  return null;
}

function unwrapToFunction(expr: ts.Expression): ts.SignatureDeclarationBase | null {
  if (ts.isFunctionExpression(expr) || ts.isArrowFunction(expr)) return expr;
  if (ts.isParenthesizedExpression(expr)) return unwrapToFunction(expr.expression);

  if (ts.isCallExpression(expr)) {
    for (const arg of expr.arguments) {
      const result = unwrapToFunction(arg);
      if (result) return result;
    }
  }
  return null;
}

function extractClassPropsSignature(
  cls: ts.ClassDeclaration,
  checker: ts.TypeChecker,
): ts.SignatureDeclarationBase | null {
  if (!cls.heritageClauses) return null;
  for (const clause of cls.heritageClauses) {
    if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;
    for (const typeExpr of clause.types) {
      const type = checker.getTypeAtLocation(typeExpr);
      const typeArgs = typeExpr.typeArguments;
      if (typeArgs && typeArgs.length > 0) {
        const sig = checker.getSignaturesOfType(type, ts.SignatureKind.Construct)[0];
        if (sig) return sig.getDeclaration();
      }
    }
  }
  return null;
}

function emptyProps(): PropsInfo {
  return { properties: [], hasChildren: false, hasRef: false };
}
