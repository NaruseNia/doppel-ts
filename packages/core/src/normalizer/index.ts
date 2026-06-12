import ts from "typescript";
import type { ComponentInfo } from "../types/component.js";
import type { PropsInfo } from "../types/props.js";
import type { NormalizedJSXTree } from "../types/jsx.js";
import type { NormalizedComponentData } from "./types.js";
import { normalizeProps } from "./props-normalizer.js";
import { extractStyleInfo } from "./style-extractor.js";
import { extractBehaviorInfo } from "./behavior-extractor.js";

export type {
  NormalizedComponentData,
  NormalizedProps,
  NormalizedStyleInfo,
  NormalizedBehaviorInfo,
} from "./types.js";
export { normalizeProps } from "./props-normalizer.js";
export { extractStyleInfo } from "./style-extractor.js";
export { extractBehaviorInfo } from "./behavior-extractor.js";

export function normalizeComponent(
  component: ComponentInfo,
  props: PropsInfo,
  jsxTree: NormalizedJSXTree,
  program: ts.Program,
): NormalizedComponentData {
  return {
    id: `${component.filePath}:${component.name}`,
    name: component.name,
    filePath: component.filePath,
    line: component.line,
    props: normalizeProps(props),
    jsxTree,
    style: extractStyleInfo(jsxTree),
    behavior: extractBehaviorInfo(component, program),
  };
}

export function normalizeAll(
  components: ComponentInfo[],
  extractProps: (c: ComponentInfo) => PropsInfo,
  extractJSXTree: (c: ComponentInfo) => NormalizedJSXTree,
  program: ts.Program,
): NormalizedComponentData[] {
  return components.map((c) => normalizeComponent(c, extractProps(c), extractJSXTree(c), program));
}
