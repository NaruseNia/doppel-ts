import type { ResolvedConfig } from "./config/schema.js";
import type { NormalizedComponentData } from "./normalizer/types.js";
import { TS6CompilerParser } from "./parser/ts-compiler/index.js";
import { normalizeAll } from "./normalizer/index.js";
import { isPairSuppressed } from "./suppress/index.js";
import { getIgnoredComponents } from "./suppress/comment-parser.js";

export interface AnalyzeOptions {
  filePaths: string[];
  config: ResolvedConfig;
  tsConfigPath?: string;
}

export interface AnalyzeResult {
  components: NormalizedComponentData[];
  totalComponents: number;
}

export function analyze(options: AnalyzeOptions): AnalyzeResult {
  const parser = new TS6CompilerParser(options.tsConfigPath);

  try {
    const allComponents = parser.extractComponents(options.filePaths);

    const ignoredNames = new Set<string>();
    for (const filePath of options.filePaths) {
      const sourceFile = parser.tsProgram.getSourceFile(filePath);
      if (sourceFile) {
        for (const name of getIgnoredComponents(sourceFile)) {
          ignoredNames.add(name);
        }
      }
    }

    const components = allComponents.filter((c) => !ignoredNames.has(c.name));

    const normalized = normalizeAll(
      components,
      (c) => parser.extractProps(c),
      (c) => parser.extractJSXTree(c),
      parser.tsProgram,
    );

    return {
      components: normalized,
      totalComponents: normalized.length,
    };
  } finally {
    parser.dispose();
  }
}

export function filterSuppressed(
  pairs: Array<{ componentA: { name: string }; componentB: { name: string } }>,
  suppress: [string, string][],
): typeof pairs {
  if (suppress.length === 0) return pairs;
  return pairs.filter((p) => !isPairSuppressed(p.componentA.name, p.componentB.name, suppress));
}
