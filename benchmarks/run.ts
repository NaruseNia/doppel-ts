import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const CLI = path.resolve(import.meta.dirname, "..", "packages", "cli", "dist", "index.js");
const FIXTURES_ROOT = path.resolve(import.meta.dirname, "..", "fixtures");
const BASELINE_PATH = path.resolve(import.meta.dirname, "baseline.json");

interface BenchmarkResult {
  name: string;
  components: number;
  pairs: number;
  durationMs: number;
}

function runBenchmark(name: string, fixturePath: string): BenchmarkResult {
  const start = performance.now();
  const output = execSync(`node ${CLI} --format json --minimal ${fixturePath}`, {
    encoding: "utf-8",
    cwd: path.resolve(import.meta.dirname, ".."),
    timeout: 300_000,
    maxBuffer: 50 * 1024 * 1024,
  });
  const elapsed = performance.now() - start;

  const result = JSON.parse(output);
  return {
    name,
    components: result.meta.totalComponents,
    pairs: result.meta.totalPairs,
    durationMs: Math.round(elapsed),
  };
}

function main() {
  console.log("doppel-ts benchmark\n");

  const sizes = ["small", "medium", "large"] as const;
  const results: BenchmarkResult[] = [];

  for (const size of sizes) {
    const dir = path.join(FIXTURES_ROOT, size);
    if (!fs.existsSync(dir)) {
      console.log(`Skipping ${size} (not generated — run generate-fixtures first)`);
      continue;
    }

    process.stdout.write(`Running ${size}...`);
    const result = runBenchmark(size, dir);
    results.push(result);
    console.log(` ${result.durationMs}ms (${result.components} components, ${result.pairs} pairs)`);
  }

  console.log("\n--- Results ---");
  console.log(results.map((r) => `${r.name}: ${r.durationMs}ms`).join("\n"));

  // Compare with baseline
  if (fs.existsSync(BASELINE_PATH)) {
    const baseline: BenchmarkResult[] = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8"));
    console.log("\n--- vs Baseline ---");
    for (const result of results) {
      const base = baseline.find((b) => b.name === result.name);
      if (base) {
        const ratio = result.durationMs / base.durationMs;
        const pct = Math.round((ratio - 1) * 100);
        const status = ratio > 1.2 ? "⚠️  REGRESSION" : ratio < 0.8 ? "🚀 FASTER" : "✅ OK";
        console.log(
          `${result.name}: ${pct > 0 ? "+" : ""}${pct}% (${base.durationMs}ms → ${result.durationMs}ms) ${status}`,
        );
      }
    }
  }

  // Save as baseline
  if (process.argv.includes("--save")) {
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(results, null, 2));
    console.log(`\nBaseline saved to ${BASELINE_PATH}`);
  }
}

main();
