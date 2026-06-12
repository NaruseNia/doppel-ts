import { intro, outro, spinner, log } from "@clack/prompts";
import { loadConfig, resolveConfig } from "@doppel-ts/core";
import { parseArgs, printHelp } from "./args.js";
import { scanFiles } from "./scanner.js";

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

  if (args.format === "terminal") {
    intro("doppel-ts");
  }

  const s = args.format === "terminal" ? spinner() : null;

  s?.start("Loading config...");
  const userConfig = await loadConfig();
  const cliOverrides: Record<string, unknown> = {};
  if (args.threshold !== undefined) cliOverrides.threshold = args.threshold;
  if (args.exclude.length > 0) cliOverrides.exclude = args.exclude;
  if (args.includeLocal) cliOverrides.includeLocal = true;
  if (args.noSuppress) cliOverrides.suppress = [];
  const config = resolveConfig(userConfig, cliOverrides);
  s?.stop("Config loaded");

  s?.start("Scanning files...");
  const include =
    args.paths.length > 0 ? args.paths.map((p) => `${p}/**/*.{tsx,jsx}`) : config.include;
  const files = await scanFiles(include, config.exclude, process.cwd());
  s?.stop(`Found ${files.length} files`);

  if (files.length === 0) {
    if (args.format === "terminal") {
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

  // TODO: TASK-013/015 — wire full pipeline (parse → normalize → similarity → output)
  s?.start(`Analyzing ${files.length} files...`);
  s?.stop(`Analyzed ${files.length} files`);

  if (args.format === "terminal") {
    log.info(`Scanned ${files.length} files`);
    log.info("Similarity analysis not yet wired (TASK-015)");
    outro("Done");
  } else {
    console.log(
      JSON.stringify({
        meta: { version: VERSION, totalComponents: 0, totalPairs: 0, scanPaths: args.paths },
        pairs: [],
      }),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
