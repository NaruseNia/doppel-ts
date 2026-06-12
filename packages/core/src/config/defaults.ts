import type { ResolvedConfig } from "./schema.js";

export const DEFAULT_CONFIG: ResolvedConfig = {
  include: ["**/*.tsx", "**/*.jsx"],
  exclude: ["**/*.test.*", "**/*.spec.*", "**/*.stories.*", "**/node_modules/**"],
  threshold: {
    high: 0.9,
    medium: 0.7,
  },
  weights: {
    props: 0.5,
    jsx: 0.35,
    style: 0.1,
    behavior: 0.05,
  },
  suppress: [],
  includeLocal: false,
};
