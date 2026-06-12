import { describe, it, expect } from "vitest";
import type { ParserInterface } from "../src/parser/interface.js";

describe("ParserInterface", () => {
  it("can be implemented with stub methods", () => {
    const stub: ParserInterface = {
      extractComponents: () => [],
      extractProps: () => ({ properties: [], hasChildren: false, hasRef: false }),
      extractJSXTree: () => ({ root: { kind: "fragment", children: [] } }),
      dispose: () => {},
    };

    expect(stub.extractComponents([])).toEqual([]);
    expect(
      stub.extractProps({
        name: "Test",
        filePath: "test.tsx",
        line: 1,
        column: 0,
        exportType: "named",
        wrappers: [],
        isLocal: false,
      }),
    ).toEqual({ properties: [], hasChildren: false, hasRef: false });
    expect(
      stub.extractJSXTree({
        name: "Test",
        filePath: "test.tsx",
        line: 1,
        column: 0,
        exportType: "named",
        wrappers: [],
        isLocal: false,
      }),
    ).toEqual({ root: { kind: "fragment", children: [] } });
  });

  it("enforces dispose method", () => {
    const stub: ParserInterface = {
      extractComponents: () => [],
      extractProps: () => ({ properties: [], hasChildren: false, hasRef: false }),
      extractJSXTree: () => ({ root: { kind: "fragment", children: [] } }),
      dispose: () => {},
    };

    expect(() => stub.dispose()).not.toThrow();
  });
});
