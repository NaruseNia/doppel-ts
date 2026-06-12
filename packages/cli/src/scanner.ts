import { glob } from "tinyglobby";
import path from "node:path";

export async function scanFiles(
  include: string[],
  exclude: string[],
  cwd: string,
): Promise<string[]> {
  const files = await glob(include, {
    cwd,
    ignore: exclude,
    absolute: true,
  });

  return files.map((f) => path.resolve(f)).sort();
}
