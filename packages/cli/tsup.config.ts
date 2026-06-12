import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  banner: { js: "#!/usr/bin/env node" },
  clean: true,
  noExternal: [/^(?!@doppel-ts\/native$|^typescript$|^jiti$)/],
  external: ["typescript", "@doppel-ts/native", "jiti"],
});
