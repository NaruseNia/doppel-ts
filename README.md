# doppel-ts

Detect duplicate and similar React components in your codebase.

doppel-ts statically analyzes your React project, measures structural similarity between components, and reports near-duplicates that are candidates for consolidation. It is fully deterministic — no AI inside — and outputs rich structured data that AI agents can consume downstream.

## Features

- **Props + JSX similarity** — Compares component interfaces (Props types) and render structure (JSX trees) as primary similarity signals
- **Two-phase algorithm** — Fast feature-vector filtering narrows O(N²) pairs, then precise Tree Edit Distance comparison on candidates
- **Rust-powered core** — Similarity engine built in Rust (via napi-rs) for high performance
- **Rich JSON output** — Structured data including Props details, normalized JSX trees, and diff breakdowns — designed for AI agent consumption
- **Configurable thresholds** — Multi-level severity (high / medium) with customizable weights per similarity dimension
- **Suppress false positives** — Exclude intentionally similar pairs via config or `// doppel-ignore` comments

## Install

```bash
npm install -D doppel-ts
```

## Quick Start

```bash
# Scan components directory
npx doppel-ts src/components

# Multiple directories
npx doppel-ts src/components src/ui

# With custom threshold
npx doppel-ts src/components --threshold 0.8

# JSON output (for CI or AI consumption)
npx doppel-ts src/components --format json

# Lightweight JSON
npx doppel-ts src/components --format json --minimal

# Detailed breakdown
npx doppel-ts src/components --detail
```

## Output Example

```
doppel-ts v1.0.0 — scanning 142 components...

 HIGH (≥90%)
  PrimaryButton ↔ SubmitButton     92%   src/components/PrimaryButton.tsx ↔ src/components/SubmitButton.tsx
  UserCard      ↔ ProfileCard      91%   src/components/UserCard.tsx ↔ src/components/ProfileCard.tsx

 MEDIUM (≥70%)
  SearchInput   ↔ FilterInput      78%   src/components/SearchInput.tsx ↔ src/components/FilterInput.tsx

Found 3 similar pairs (2 high, 1 medium) across 142 components.
```

## Configuration

Create `doppel.config.ts` in your project root:

```typescript
import { defineConfig } from "doppel-ts";

export default defineConfig({
  include: ["src/components/**/*.tsx"],
  exclude: ["**/*.test.tsx", "**/*.stories.tsx"],

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

  suppress: [
    ["BaseButton", "IconButton"],
    ["*Layout*", "*Container*"],
  ],
});
```

### Configuration Priority

```
CLI flags > doppel.config.ts > defaults
```

## CLI Options

| Flag                   | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `[paths...]`           | Directories or glob patterns to scan (default: cwd) |
| `--exclude <pattern>`  | Exclude files matching pattern (repeatable)         |
| `--threshold <number>` | Minimum similarity score (0.0-1.0)                  |
| `--detail`             | Show per-dimension similarity breakdown             |
| `--format <type>`      | Output format: `terminal` (default) or `json`       |
| `--minimal`            | Lightweight JSON output (with `--format json`)      |
| `--include-local`      | Include non-exported local components               |
| `--no-suppress`        | Disable all suppress rules                          |
| `--help`               | Show help                                           |
| `--version`            | Show version                                        |

## JSON Output

Default JSON output includes rich structural data for each similar pair:

```json
{
  "meta": {
    "version": "1.0.0",
    "totalComponents": 142,
    "totalPairs": 3,
    "config": { "...": "..." }
  },
  "pairs": [
    {
      "score": 0.92,
      "level": "high",
      "breakdown": { "props": 0.95, "jsx": 0.88, "style": 0.9, "behavior": 0.85 },
      "componentA": { "name": "PrimaryButton", "filePath": "...", "props": ["..."], "jsxTree": {} },
      "componentB": { "name": "SubmitButton", "filePath": "...", "props": ["..."], "jsxTree": {} },
      "diff": { "commonProps": ["..."], "uniqueToA": ["..."], "uniqueToB": ["..."] }
    }
  ]
}
```

Use `--minimal` for a lightweight version with just names, paths, and scores.

## Suppressing Results

### In config

```typescript
export default defineConfig({
  suppress: [
    ["BaseButton", "IconButton"], // exact names
    ["*Layout*", "*Container*"], // glob patterns
  ],
});
```

### In source

```tsx
// doppel-ignore
export function SpecialButton(props: ButtonProps) {
  // ...
}
```

## Architecture

doppel-ts uses a TypeScript + Rust hybrid architecture:

- **TypeScript** — AST parsing via TypeScript Compiler API, component detection, Props/JSX extraction, normalization
- **Rust** (napi-rs) — Feature vector generation, cosine similarity filtering, Tree Edit Distance computation

The parser layer is abstracted to support future backends (Strada API, SWC/oxc).

## Requirements

- Node.js ≥ 20 or Bun ≥ 1.x
- React project with TypeScript (.tsx files)

## Roadmap

- [ ] Vue / Svelte / Web Components support (plugin system)
- [ ] Component clustering (grouping similar components)
- [ ] HTML visual reports
- [ ] CI bot integration (PR comments)
- [ ] SWC / oxc fast parser backend
- [ ] Strada API support (TypeScript 7.1+)

## License

Licensed under either of:

- MIT License ([LICENSE-MIT](LICENSE-MIT))
- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE))

at your option.
