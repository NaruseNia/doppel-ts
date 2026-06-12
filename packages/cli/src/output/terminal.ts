import path from "node:path";
import { log } from "@clack/prompts";
import type { AnalysisOutput, SimilarityPair } from "./types.js";

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const useColor = process.env.NO_COLOR === undefined && process.stdout.isTTY;

function c(code: string, text: string): string {
  return useColor ? `${code}${text}${RESET}` : text;
}

export function formatTerminal(output: AnalysisOutput, detail: boolean): void {
  if (output.pairs.length === 0) {
    log.success(`No similar components found across ${output.totalComponents} components`);
    return;
  }

  const grouped = groupByLevel(output.pairs);

  for (const [level, pairs] of grouped) {
    const color = level === "high" ? RED : YELLOW;
    const threshold = output.config.threshold[level];
    const header =
      threshold !== undefined
        ? `${level.toUpperCase()} (≥${Math.round(threshold * 100)}%)`
        : level.toUpperCase();
    log.message(c(BOLD, c(color, ` ${header}`)));

    for (const pair of pairs) {
      const scorePct = `${Math.round(pair.score * 100)}%`;
      const nameA = pair.componentA.name;
      const nameB = pair.componentB.name;
      const cwd = process.cwd();
      const pathA = relativePath(pair.componentA.filePath, cwd);
      const pathB = relativePath(pair.componentB.filePath, cwd);

      log.message(
        `  ${c(BOLD, nameA)} ${DIM}↔${RESET} ${c(BOLD, nameB)}  ${c(color, scorePct)}  ${c(DIM, `${pathA} ↔ ${pathB}`)}`,
      );

      if (detail) {
        const b = pair.breakdown;
        const parts = [`props: ${pct(b.props)}`, `jsx: ${pct(b.jsx)}`];
        if (b.style !== undefined) parts.push(`style: ${pct(b.style)}`);
        if (b.behavior !== undefined) parts.push(`behavior: ${pct(b.behavior)}`);
        log.message(c(DIM, `    ${parts.join("  ")}`));

        const propsA = pair.componentA.props.map((p) => p.name);
        const propsB = pair.componentB.props.map((p) => p.name);
        const common = propsA.filter((n) => propsB.includes(n));
        const uniqueA = propsA.filter((n) => !propsB.includes(n));
        const uniqueB = propsB.filter((n) => !propsA.includes(n));

        if (common.length > 0) log.message(c(DIM, `    common: ${common.join(", ")}`));
        if (uniqueA.length > 0) log.message(c(DIM, `    only ${nameA}: ${uniqueA.join(", ")}`));
        if (uniqueB.length > 0) log.message(c(DIM, `    only ${nameB}: ${uniqueB.join(", ")}`));
      }
    }
  }

  const counts = [...grouped.entries()]
    .map(([level, pairs]) => `${pairs.length} ${level}`)
    .join(", ");
  log.info(
    `Found ${output.pairs.length} similar pairs (${counts}) across ${output.totalComponents} components`,
  );
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function relativePath(filePath: string, cwd: string): string {
  const rel = path.relative(cwd, filePath);
  if (rel.length < filePath.length) return rel;
  return filePath;
}

function groupByLevel(pairs: SimilarityPair[]): Map<string, SimilarityPair[]> {
  const map = new Map<string, SimilarityPair[]>();
  for (const pair of pairs) {
    const existing = map.get(pair.level);
    if (existing) {
      existing.push(pair);
    } else {
      map.set(pair.level, [pair]);
    }
  }
  return map;
}
