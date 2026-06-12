import ts from "typescript";
import type { ComponentInfo } from "../types/component.js";
import type { NormalizedJSXTree, JSXNode, JSXAttribute } from "../types/jsx.js";

export function extractJSXTree(component: ComponentInfo, program: ts.Program): NormalizedJSXTree {
  const sourceFile = program.getSourceFile(component.filePath);
  if (!sourceFile) return emptyTree();

  const fn = findFunctionBody(sourceFile, component);
  if (!fn) return emptyTree();

  const jsxRoots = collectJSXRoots(fn);
  if (jsxRoots.length === 0) return emptyTree();

  if (jsxRoots.length === 1) {
    return { root: convertNode(jsxRoots[0]) };
  }
  return {
    root: { kind: "fragment", children: jsxRoots.map(convertNode) },
  };
}

function convertNode(node: ts.Node): JSXNode {
  if (ts.isJsxElement(node)) {
    const tag = node.openingElement.tagName.getText();
    return {
      kind: "element",
      tag,
      attributes: extractAttributes(node.openingElement.attributes),
      children: node.children.map(convertChild).filter(Boolean) as JSXNode[],
      isComponent: isComponentTag(tag),
    };
  }

  if (ts.isJsxSelfClosingElement(node)) {
    const tag = node.tagName.getText();
    return {
      kind: "element",
      tag,
      attributes: extractAttributes(node.attributes),
      children: [],
      isComponent: isComponentTag(tag),
    };
  }

  if (ts.isJsxFragment(node)) {
    return {
      kind: "fragment",
      children: node.children.map(convertChild).filter(Boolean) as JSXNode[],
    };
  }

  if (ts.isJsxExpression(node)) {
    return convertExpression(node);
  }

  if (ts.isJsxText(node)) {
    if (node.text.trim() === "") return null as unknown as JSXNode;
    return { kind: "text" };
  }

  return { kind: "text" };
}

function convertChild(node: ts.JsxChild): JSXNode | null {
  if (ts.isJsxText(node) && node.text.trim() === "") return null;
  return convertNode(node);
}

function convertExpression(node: ts.JsxExpression): JSXNode {
  if (!node.expression) return { kind: "text" };

  const expr = node.expression;

  if (ts.isConditionalExpression(expr)) {
    const children: JSXNode[] = [];
    const whenTrue = extractJSXFromExpression(expr.whenTrue);
    const whenFalse = extractJSXFromExpression(expr.whenFalse);
    if (whenTrue) children.push(whenTrue);
    if (whenFalse) children.push(whenFalse);
    return { kind: "expression", expressionType: "conditional", children };
  }

  if (
    ts.isBinaryExpression(expr) &&
    expr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
  ) {
    const children: JSXNode[] = [];
    const right = extractJSXFromExpression(expr.right);
    if (right) children.push(right);
    return { kind: "expression", expressionType: "conditional", children };
  }

  if (ts.isCallExpression(expr)) {
    const callee = expr.expression;
    if (ts.isPropertyAccessExpression(callee) && callee.name.text === "map") {
      const children: JSXNode[] = [];
      const callback = expr.arguments[0];
      if (callback) {
        const jsx = extractJSXFromExpression(callback);
        if (jsx) children.push(jsx);
      }
      return { kind: "expression", expressionType: "map", children };
    }
    return { kind: "expression", expressionType: "call", children: [] };
  }

  return { kind: "expression", expressionType: "other", children: [] };
}

function extractJSXFromExpression(node: ts.Node): JSXNode | null {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
    return convertNode(node);
  }
  if (ts.isParenthesizedExpression(node)) {
    return extractJSXFromExpression(node.expression);
  }
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    if (node.body) {
      if (ts.isBlock(node.body)) {
        let result: JSXNode | null = null;
        node.body.forEachChild((child) => {
          if (result) return;
          if (ts.isReturnStatement(child) && child.expression) {
            result = extractJSXFromExpression(child.expression);
          }
        });
        return result;
      }
      return extractJSXFromExpression(node.body);
    }
  }
  return null;
}

function extractAttributes(attrs: ts.JsxAttributes): JSXAttribute[] {
  const result: JSXAttribute[] = [];
  for (const attr of attrs.properties) {
    if (ts.isJsxAttribute(attr)) {
      const name = attr.name.getText();
      let valueType: JSXAttribute["valueType"] = "boolean";
      if (attr.initializer) {
        if (ts.isStringLiteral(attr.initializer)) {
          valueType = "string";
        } else {
          valueType = "expression";
        }
      }
      result.push({ name, valueType });
    }
    if (ts.isJsxSpreadAttribute(attr)) {
      result.push({ name: "...", valueType: "spread" });
    }
  }
  return result;
}

function isComponentTag(tag: string): boolean {
  return /^[A-Z]/.test(tag);
}

function collectJSXRoots(body: ts.Node): ts.Node[] {
  const roots: ts.Node[] = [];
  function visit(node: ts.Node) {
    if (ts.isReturnStatement(node) && node.expression) {
      const jsx = findJSXInExpression(node.expression);
      if (jsx) roots.push(jsx);
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(body);
  return roots;
}

function findJSXInExpression(node: ts.Node): ts.Node | null {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
    return node;
  }
  if (ts.isParenthesizedExpression(node)) {
    return findJSXInExpression(node.expression);
  }
  return null;
}

function findFunctionBody(sourceFile: ts.SourceFile, component: ComponentInfo): ts.Node | null {
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === component.name) {
      return statement.body ?? null;
    }

    if (ts.isClassDeclaration(statement) && statement.name?.text === component.name) {
      for (const member of statement.members) {
        if (
          ts.isMethodDeclaration(member) &&
          ts.isIdentifier(member.name) &&
          member.name.text === "render"
        ) {
          return member.body ?? null;
        }
      }
    }

    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === component.name && decl.initializer) {
          const fn = unwrapToFunctionBody(decl.initializer);
          if (fn) return fn;
        }
      }
    }

    if (ts.isExportAssignment(statement) && ts.isIdentifier(statement.expression)) {
      if (statement.expression.text === component.name) {
        const result = findFunctionBody(sourceFile, { ...component, name: component.name });
        if (result) return result;
      }
    }
  }
  return null;
}

function unwrapToFunctionBody(expr: ts.Expression): ts.Node | null {
  if (ts.isFunctionExpression(expr) || ts.isArrowFunction(expr)) {
    return expr.body;
  }
  if (ts.isParenthesizedExpression(expr)) {
    return unwrapToFunctionBody(expr.expression);
  }
  if (ts.isCallExpression(expr)) {
    for (const arg of expr.arguments) {
      const result = unwrapToFunctionBody(arg);
      if (result) return result;
    }
  }
  return null;
}

function emptyTree(): NormalizedJSXTree {
  return { root: { kind: "fragment", children: [] } };
}
