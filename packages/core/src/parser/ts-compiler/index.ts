import ts from "typescript";
import type { ParserFactory, ParserInterface } from "../interface.js";
import type { ComponentInfo } from "../../types/component.js";
import type { PropsInfo } from "../../types/props.js";
import type { NormalizedJSXTree } from "../../types/jsx.js";
import { detectComponents } from "../../detector/index.js";
import { extractProps as extractPropsImpl } from "../../extractor/props.js";

export class TS6CompilerParser implements ParserInterface {
  private program: ts.Program;
  private checker: ts.TypeChecker;

  constructor(tsConfigPath?: string) {
    const configPath = tsConfigPath ?? ts.findConfigFile(process.cwd(), ts.sys.fileExists);
    if (!configPath) {
      throw new Error("tsconfig.json not found");
    }

    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      ts.sys.resolvePath(configPath + "/.."),
    );

    this.program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
    this.checker = this.program.getTypeChecker();
  }

  extractComponents(filePaths: string[]): ComponentInfo[] {
    return detectComponents(filePaths, this.program, this.checker);
  }

  extractProps(component: ComponentInfo): PropsInfo {
    return extractPropsImpl(component, this.program, this.checker);
  }

  extractJSXTree(_component: ComponentInfo): NormalizedJSXTree {
    // TASK-005 で実装
    return { root: { kind: "fragment", children: [] } };
  }

  dispose(): void {
    // TypeScript Compiler API にはリソース解放不要だが、
    // 将来のパーサー実装で必要になる可能性があるためインターフェースに含める
  }

  get typeChecker(): ts.TypeChecker {
    return this.checker;
  }

  get tsProgram(): ts.Program {
    return this.program;
  }
}

export const ts6CompilerFactory: ParserFactory = {
  create(tsConfigPath?: string): ParserInterface {
    return new TS6CompilerParser(tsConfigPath);
  },
};
