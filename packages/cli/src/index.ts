import { analyze } from "@doppel-ts/core";

const paths = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));

const result = await analyze({ paths: paths.length > 0 ? paths : ["."] });

console.log(
	`doppel-ts — scanned ${result.totalComponents} components, found ${result.pairs.length} similar pairs.`,
);
