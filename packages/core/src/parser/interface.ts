import type { ComponentInfo } from "../types/component.js";
import type { PropsInfo } from "../types/props.js";
import type { NormalizedJSXTree } from "../types/jsx.js";

export interface ParserInterface {
  extractComponents(filePaths: string[]): ComponentInfo[];
  extractProps(component: ComponentInfo): PropsInfo;
  extractJSXTree(component: ComponentInfo): NormalizedJSXTree;
  dispose(): void;
}

export interface ParserFactory {
  create(tsConfigPath?: string): ParserInterface;
}
