import ts from "typescript";
import type { ComponentInfo } from "../types/component.js";

export function detectClassComponents(
  sourceFile: ts.SourceFile,
  _checker: ts.TypeChecker,
): ComponentInfo[] {
  const components: ComponentInfo[] = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement) || !statement.name) continue;
    if (!hasExportModifier(statement)) continue;
    if (!extendsReactComponent(statement)) continue;
    if (!hasRenderMethod(statement)) continue;

    const { line, character } = sourceFile.getLineAndCharacterOfPosition(statement.getStart());
    components.push({
      name: statement.name.text,
      filePath: sourceFile.fileName,
      line: line + 1,
      column: character,
      exportType: hasDefaultModifier(statement) ? "default" : "named",
      wrappers: [],
      isLocal: false,
    });
  }

  return components;
}

function extendsReactComponent(cls: ts.ClassDeclaration): boolean {
  if (!cls.heritageClauses) return false;
  for (const clause of cls.heritageClauses) {
    if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;
    for (const type of clause.types) {
      const text = type.expression.getText();
      if (
        text === "React.Component" ||
        text === "React.PureComponent" ||
        text === "Component" ||
        text === "PureComponent"
      ) {
        return true;
      }
    }
  }
  return false;
}

function hasRenderMethod(cls: ts.ClassDeclaration): boolean {
  return cls.members.some(
    (m) => ts.isMethodDeclaration(m) && ts.isIdentifier(m.name) && m.name.text === "render",
  );
}

function hasExportModifier(node: ts.Statement): boolean {
  return ts.canHaveModifiers(node)
    ? (ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false)
    : false;
}

function hasDefaultModifier(node: ts.Statement): boolean {
  return ts.canHaveModifiers(node)
    ? (ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) ?? false)
    : false;
}
