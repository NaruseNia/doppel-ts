export { analyze } from "./analyze.js";
export {
  defineConfig,
  loadConfig,
  resolveConfig,
  DEFAULT_CONFIG,
  validateConfig,
  ConfigValidationError,
} from "./config/index.js";
export type { DoppelConfig, ResolvedConfig } from "./config/index.js";

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
