export { analyze } from "./analyze.js";
export { defineConfig } from "./config/schema.js";
export type { DoppelConfig } from "./config/schema.js";

export type { ParserInterface, ParserFactory } from "./parser/interface.js";
export { TS6CompilerParser, ts6CompilerFactory } from "./parser/ts-compiler/index.js";

export type {
  ComponentInfo,
  WrapperType,
  PropsInfo,
  PropProperty,
  TypeDescriptor,
  NormalizedJSXTree,
  JSXNode,
  JSXElementNode,
  JSXFragmentNode,
  JSXTextNode,
  JSXExpressionNode,
  JSXAttribute,
} from "./types/index.js";
