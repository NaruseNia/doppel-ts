import path from "node:path";
import fs from "node:fs";
import { createJiti } from "jiti";
import type { DoppelConfig, ResolvedConfig } from "./schema.js";
import { DEFAULT_CONFIG } from "./defaults.js";
import { validateConfig } from "./validate.js";

const CONFIG_FILES = ["doppel.config.ts", "doppel.config.js", "doppel.config.mjs"];

export async function loadConfig(cwd?: string): Promise<ResolvedConfig> {
  const dir = cwd ?? process.cwd();
  const userConfig = await findAndLoadConfig(dir);
  if (userConfig) {
    validateConfig(userConfig);
  }
  return resolveConfig(userConfig ?? {});
}

async function findAndLoadConfig(dir: string): Promise<DoppelConfig | null> {
  for (const filename of CONFIG_FILES) {
    const filepath = path.join(dir, filename);
    if (fs.existsSync(filepath)) {
      const jiti = createJiti(dir);
      const mod = await jiti.import(filepath);
      const config = (mod as { default?: DoppelConfig }).default ?? mod;
      return config as DoppelConfig;
    }
  }
  return null;
}

export function resolveConfig(
  user: DoppelConfig,
  cliOverrides?: Partial<DoppelConfig>,
): ResolvedConfig {
  const merged = { ...user, ...cliOverrides };

  const threshold = resolveThreshold(merged.threshold);

  return {
    include: merged.include ?? DEFAULT_CONFIG.include,
    exclude: merged.exclude
      ? [...DEFAULT_CONFIG.exclude, ...merged.exclude]
      : DEFAULT_CONFIG.exclude,
    threshold,
    weights: {
      props: merged.weights?.props ?? DEFAULT_CONFIG.weights.props,
      jsx: merged.weights?.jsx ?? DEFAULT_CONFIG.weights.jsx,
      style: merged.weights?.style ?? DEFAULT_CONFIG.weights.style,
      behavior: merged.weights?.behavior ?? DEFAULT_CONFIG.weights.behavior,
    },
    suppress: merged.suppress ?? DEFAULT_CONFIG.suppress,
    includeLocal: merged.includeLocal ?? DEFAULT_CONFIG.includeLocal,
  };
}

function resolveThreshold(input: DoppelConfig["threshold"]): Record<string, number> {
  if (input === undefined) {
    return { ...DEFAULT_CONFIG.threshold };
  }
  if (typeof input === "number") {
    return { minimum: input };
  }
  return { ...input };
}
