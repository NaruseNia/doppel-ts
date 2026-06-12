import type { NormalizedJSXTree, JSXNode } from "../types/jsx.js";
import type { NormalizedStyleInfo } from "./types.js";

export function extractStyleInfo(jsxTree: NormalizedJSXTree): NormalizedStyleInfo | undefined {
  const classNames: string[] = [];
  let styledComponents = false;
  let cssModules = false;

  visitNode(jsxTree.root, (node) => {
    if (node.kind !== "element") return;
    for (const attr of node.attributes) {
      if (attr.name === "className" || attr.name === "class") {
        if (attr.valueType === "string") {
          classNames.push(attr.name);
        } else if (attr.valueType === "expression") {
          if (!cssModules) cssModules = true;
        }
      }
      if (attr.name === "css") {
        styledComponents = true;
      }
    }
    if (node.isComponent && node.tag.includes("Styled")) {
      styledComponents = true;
    }
  });

  if (classNames.length === 0 && !styledComponents && !cssModules) {
    return undefined;
  }

  return { classNames, styledComponents, cssModules };
}

function visitNode(node: JSXNode, fn: (node: JSXNode) => void): void {
  fn(node);
  if (node.kind === "element" || node.kind === "fragment" || node.kind === "expression") {
    for (const child of node.children) {
      visitNode(child, fn);
    }
  }
}
