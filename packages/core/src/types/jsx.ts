export interface NormalizedJSXTree {
  root: JSXNode;
}

export type JSXNode = JSXElementNode | JSXFragmentNode | JSXTextNode | JSXExpressionNode;

export interface JSXElementNode {
  kind: "element";
  tag: string;
  attributes: JSXAttribute[];
  children: JSXNode[];
  isComponent: boolean;
}

export interface JSXFragmentNode {
  kind: "fragment";
  children: JSXNode[];
}

export interface JSXTextNode {
  kind: "text";
}

export interface JSXExpressionNode {
  kind: "expression";
  expressionType: "conditional" | "map" | "call" | "other";
  children: JSXNode[];
}

export interface JSXAttribute {
  name: string;
  valueType: "string" | "expression" | "spread" | "boolean";
}
