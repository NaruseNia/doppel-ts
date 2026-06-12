import path from "node:path";
import type { AnalysisOutput } from "./types.js";

const cwd = process.cwd();
function rel(filePath: string): string {
  const r = path.relative(cwd, filePath);
  return r.length < filePath.length ? r : filePath;
}

export function formatRichJson(output: AnalysisOutput): string {
  return JSON.stringify(
    {
      meta: {
        version: output.version,
        timestamp: new Date().toISOString(),
        scanPaths: output.scanPaths,
        config: output.config,
        totalComponents: output.totalComponents,
        totalPairs: output.pairs.length,
      },
      pairs: output.pairs.map((pair) => ({
        score: pair.score,
        level: pair.level,
        breakdown: pair.breakdown,
        componentA: {
          name: pair.componentA.name,
          filePath: rel(pair.componentA.filePath),
          line: pair.componentA.line,
          props: pair.componentA.props.map((p) => ({
            name: p.name,
            type: p.typeSignature,
            optional: p.optional,
          })),
          jsxTree: pair.componentA.jsxTree,
        },
        componentB: {
          name: pair.componentB.name,
          filePath: rel(pair.componentB.filePath),
          line: pair.componentB.line,
          props: pair.componentB.props.map((p) => ({
            name: p.name,
            type: p.typeSignature,
            optional: p.optional,
          })),
          jsxTree: pair.componentB.jsxTree,
        },
        diff: computeDiff(pair),
      })),
    },
    null,
    2,
  );
}

export function formatMinimalJson(output: AnalysisOutput): string {
  return JSON.stringify(
    {
      meta: {
        version: output.version,
        totalComponents: output.totalComponents,
        totalPairs: output.pairs.length,
      },
      pairs: output.pairs.map((pair) => ({
        score: pair.score,
        level: pair.level,
        a: { name: pair.componentA.name, path: rel(pair.componentA.filePath) },
        b: { name: pair.componentB.name, path: rel(pair.componentB.filePath) },
      })),
    },
    null,
    2,
  );
}

function computeDiff(pair: {
  componentA: { props: Array<{ name: string }> };
  componentB: { props: Array<{ name: string }> };
}) {
  const propsA = pair.componentA.props.map((p) => p.name);
  const propsB = pair.componentB.props.map((p) => p.name);
  return {
    commonProps: propsA.filter((n) => propsB.includes(n)),
    uniqueToA: propsA.filter((n) => !propsB.includes(n)),
    uniqueToB: propsB.filter((n) => !propsA.includes(n)),
  };
}
