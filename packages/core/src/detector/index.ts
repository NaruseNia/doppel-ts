import ts from "typescript";
import type { ComponentInfo } from "../types/component.js";
import { detectFunctionComponents } from "./function-component.js";
import { detectClassComponents } from "./class-component.js";

export function detectComponents(
  filePaths: string[],
  program: ts.Program,
  checker: ts.TypeChecker,
): ComponentInfo[] {
  const components: ComponentInfo[] = [];

  for (const filePath of filePaths) {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) continue;

    components.push(...detectFunctionComponents(sourceFile, checker));
    components.push(...detectClassComponents(sourceFile, checker));
  }

  return components;
}

export { detectFunctionComponents } from "./function-component.js";
export { detectClassComponents } from "./class-component.js";
export { unwrapExpression } from "./wrapper-unwrap.js";
