import { intro, outro, spinner, log } from "@clack/prompts";
import { analyze, filterSuppressed, loadConfig, resolveConfig } from "@doppel-ts/core";
import type { NormalizedComponentData } from "@doppel-ts/core";
import { parseArgs, printHelp } from "./args.js";
import { scanFiles } from "./scanner.js";
import { formatTerminal } from "./output/terminal.js";
import { formatRichJson, formatMinimalJson } from "./output/json.js";
import type { AnalysisOutput, SimilarityPair, ComponentSummary } from "./output/types.js";

const VERSION = "0.0.0";

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (args.version) {
    console.log(`doppel-ts v${VERSION}`);
    process.exit(0);
  }

  const isTerminal = args.format === "terminal";
  if (isTerminal) intro("doppel-ts");
  const s = isTerminal ? spinner() : null;

  s?.start("Loading config...");
  const baseConfig = await loadConfig();
  const cliOverrides: Record<string, unknown> = {};
  if (args.threshold !== undefined) cliOverrides.threshold = args.threshold;
  if (args.exclude.length > 0) cliOverrides.exclude = args.exclude;
  if (args.includeLocal) cliOverrides.includeLocal = true;
  if (args.noSuppress) cliOverrides.suppress = [];
  const config = resolveConfig(baseConfig, cliOverrides);
  s?.stop("Config loaded");

  s?.start("Scanning files...");
  const include =
    args.paths.length > 0 ? args.paths.map((p) => `${p}/**/*.{tsx,jsx}`) : config.include;
  const files = await scanFiles(include, config.exclude, process.cwd());
  s?.stop(`Found ${files.length} files`);

  if (files.length === 0) {
    if (isTerminal) {
      log.warn("No TSX/JSX files found");
      outro("Done");
    } else {
      console.log(
        JSON.stringify({
          meta: { version: VERSION, totalComponents: 0, totalPairs: 0 },
          pairs: [],
        }),
      );
    }
    process.exit(0);
  }

  s?.start(`Analyzing ${files.length} files...`);
  const result = analyze({ filePaths: files, config });
  s?.stop(`Found ${result.totalComponents} components`);

  if (usingFallback && isTerminal) {
    log.warn("Native addon not available — using JS fallback (reduced accuracy)");
  }
  s?.start("Computing similarity...");
  const batchInput = {
    components: result.components,
    config: {
      weights: config.weights,
      thresholds: Object.entries(config.threshold).map(([name, minScore]) => ({ name, minScore })),
      filterThreshold: 0.0,
    },
  };
  let pairs: SimilarityPair[] = computeSimilarity(result.components, batchInput);
  pairs = filterSuppressed(pairs, config.suppress) as SimilarityPair[];
  s?.stop(`Found ${pairs.length} similar pairs`);

  const output: AnalysisOutput = {
    version: VERSION,
    scanPaths: args.paths.length > 0 ? args.paths : ["."],
    totalComponents: result.totalComponents,
    pairs,
    config: { threshold: config.threshold, weights: config.weights },
  };

  if (isTerminal) {
    formatTerminal(output, args.detail);
    outro("Done");
  } else {
    const json = args.minimal ? formatMinimalJson(output) : formatRichJson(output);
    console.log(json);
  }
}

import { createRequire } from "node:module";
const _require = createRequire(import.meta.url);

let nativeModule: { computeSimilarity: (json: string) => string } | null = null;
let usingFallback = false;
try {
  nativeModule = _require("@doppel-ts/native");
} catch {
  usingFallback = true;
}

function computeSimilarity(
  components: NormalizedComponentData[],
  batchInput: unknown,
): SimilarityPair[] {
  if (nativeModule) {
    const resultJson = nativeModule.computeSimilarity(JSON.stringify(batchInput));
    const result = JSON.parse(resultJson) as {
      results: Array<{
        pair: [string, string];
        overallScore: number;
        breakdown: { props: number; jsx: number; style?: number; behavior?: number };
        level: string;
      }>;
    };
    return result.results.map((r) => {
      const compA = components.find((c) => c.id === r.pair[0]);
      const compB = components.find((c) => c.id === r.pair[1]);
      return {
        score: r.overallScore,
        level: r.level,
        breakdown: r.breakdown,
        componentA: toSummary(compA ?? components[0]),
        componentB: toSummary(compB ?? components[1]),
      };
    });
  }
  return computeFallback(components);
}

function computeFallback(components: NormalizedComponentData[]): SimilarityPair[] {
  const pairs: SimilarityPair[] = [];
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const a = components[i];
      const b = components[j];
      const overlap = propOverlap(a, b);
      if (overlap > 0.5) {
        pairs.push({
          score: overlap,
          level: overlap >= 0.9 ? "high" : "medium",
          breakdown: { props: overlap, jsx: 0 },
          componentA: toSummary(a),
          componentB: toSummary(b),
        });
      }
    }
  }
  return pairs.sort((a, b) => b.score - a.score);
}

function propOverlap(a: NormalizedComponentData, b: NormalizedComponentData): number {
  if (a.props.propertyCount === 0 && b.props.propertyCount === 0) return 0;
  const namesA = a.props.properties.map((p) => p.name);
  const namesB = b.props.properties.map((p) => p.name);
  const common = namesA.filter((n) => namesB.includes(n)).length;
  const total = Math.max(namesA.length, namesB.length);
  return total > 0 ? common / total : 0;
}

function toSummary(c: NormalizedComponentData): ComponentSummary {
  return {
    name: c.name,
    filePath: c.filePath,
    line: c.line,
    props: c.props.properties,
    jsxTree: c.jsxTree,
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
