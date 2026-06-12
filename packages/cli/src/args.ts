export interface CliArgs {
  paths: string[];
  exclude: string[];
  threshold?: number;
  detail: boolean;
  format: "terminal" | "json";
  minimal: boolean;
  includeLocal: boolean;
  noSuppress: boolean;
  help: boolean;
  version: boolean;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    paths: [],
    exclude: [],
    detail: false,
    format: "terminal",
    minimal: false,
    includeLocal: false,
    noSuppress: false,
    help: false,
    version: false,
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--version" || arg === "-v") {
      args.version = true;
    } else if (arg === "--detail") {
      args.detail = true;
    } else if (arg === "--minimal") {
      args.minimal = true;
    } else if (arg === "--include-local") {
      args.includeLocal = true;
    } else if (arg === "--no-suppress") {
      args.noSuppress = true;
    } else if (arg === "--exclude" && i + 1 < argv.length) {
      i++;
      args.exclude.push(argv[i]);
    } else if (arg === "--threshold" && i + 1 < argv.length) {
      i++;
      args.threshold = Number.parseFloat(argv[i]);
    } else if (arg === "--format" && i + 1 < argv.length) {
      i++;
      const fmt = argv[i];
      if (fmt === "json" || fmt === "terminal") {
        args.format = fmt;
      }
    } else if (!arg.startsWith("-")) {
      args.paths.push(arg);
    }

    i++;
  }

  return args;
}

export function printHelp(): void {
  console.log(`doppel-ts — Detect duplicate and similar React components

Usage: doppel-ts [paths...] [options]

Arguments:
  [paths...]                Directories or glob patterns to scan (default: cwd)

Options:
  --exclude <pattern>       Exclude files matching pattern (repeatable)
  --threshold <number>      Minimum similarity score (0.0-1.0)
  --detail                  Show per-dimension similarity breakdown
  --format <type>           Output format: terminal (default) or json
  --minimal                 Lightweight JSON output (with --format json)
  --include-local           Include non-exported local components
  --no-suppress             Disable all suppress rules
  -h, --help                Show help
  -v, --version             Show version`);
}
