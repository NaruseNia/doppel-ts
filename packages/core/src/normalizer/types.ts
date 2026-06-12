import type { NormalizedJSXTree } from "../types/jsx.js";

export interface NormalizedComponentData {
  id: string;
  name: string;
  filePath: string;
  line: number;
  props: NormalizedProps;
  jsxTree: NormalizedJSXTree;
  style?: NormalizedStyleInfo;
  behavior?: NormalizedBehaviorInfo;
}

export interface NormalizedProps {
  properties: NormalizedPropEntry[];
  propertyCount: number;
}

export interface NormalizedPropEntry {
  name: string;
  typeSignature: string;
  optional: boolean;
}

export interface NormalizedStyleInfo {
  classNames: string[];
  styledComponents: boolean;
  cssModules: boolean;
}

export interface NormalizedBehaviorInfo {
  hooks: NormalizedHookEntry[];
}

export interface NormalizedHookEntry {
  name: string;
  depsCount?: number;
}
