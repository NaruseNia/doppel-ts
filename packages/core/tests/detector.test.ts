import path from "node:path";
import { describe, it, expect, beforeAll } from "vitest";
import ts from "typescript";
import { detectComponents } from "../src/detector/index.js";
import type { ComponentInfo } from "../src/types/component.js";

const FIXTURES_DIR = path.resolve(import.meta.dirname, "fixtures");
const FIXTURE_FILE = path.join(FIXTURES_DIR, "components.tsx");
const TSCONFIG_PATH = path.join(FIXTURES_DIR, "tsconfig.json");

let components: ComponentInfo[];

beforeAll(() => {
  const configFile = ts.readConfigFile(TSCONFIG_PATH, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, FIXTURES_DIR);
  const program = ts.createProgram([FIXTURE_FILE], parsed.options);
  const checker = program.getTypeChecker();
  components = detectComponents([FIXTURE_FILE], program, checker);
});

describe("detectComponents", () => {
  it("detects exported function component", () => {
    const button = components.find((c) => c.name === "Button");
    expect(button).toBeDefined();
    expect(button!.exportType).toBe("named");
    expect(button!.wrappers).toEqual([]);
    expect(button!.isLocal).toBe(false);
  });

  it("detects default export", () => {
    const card = components.find((c) => c.name === "InternalCard");
    expect(card).toBeDefined();
    expect(card!.exportType).toBe("default");
  });

  it("detects arrow function component", () => {
    const badge = components.find((c) => c.name === "Badge");
    expect(badge).toBeDefined();
    expect(badge!.exportType).toBe("named");
  });

  it("detects memo wrapped component", () => {
    const memo = components.find((c) => c.name === "MemoButton");
    expect(memo).toBeDefined();
    expect(memo!.wrappers).toEqual(["memo"]);
  });

  it("detects forwardRef wrapped component", () => {
    const input = components.find((c) => c.name === "InputField");
    expect(input).toBeDefined();
    expect(input!.wrappers).toEqual(["forwardRef"]);
  });

  it("detects nested memo + forwardRef", () => {
    const fancy = components.find((c) => c.name === "FancyInput");
    expect(fancy).toBeDefined();
    expect(fancy!.wrappers).toEqual(["memo", "forwardRef"]);
  });

  it("detects HOC wrapped component", () => {
    const themed = components.find((c) => c.name === "ThemedHeader");
    expect(themed).toBeDefined();
    expect(themed!.wrappers).toEqual([{ hoc: "withTheme" }]);
  });

  it("detects class component", () => {
    const counter = components.find((c) => c.name === "Counter");
    expect(counter).toBeDefined();
    expect(counter!.exportType).toBe("named");
  });

  it("does NOT detect non-component exports", () => {
    const fn = components.find((c) => c.name === "formatDate");
    expect(fn).toBeUndefined();
  });

  it("does NOT detect non-exported local components", () => {
    const local = components.find((c) => c.name === "LocalHelper");
    expect(local).toBeUndefined();
  });

  it("provides line numbers", () => {
    for (const comp of components) {
      expect(comp.line).toBeGreaterThan(0);
    }
  });

  it("detects expected number of components", () => {
    const names = components.map((c) => c.name).sort();
    expect(names).toEqual([
      "Badge",
      "Button",
      "Counter",
      "FancyInput",
      "InputField",
      "InternalCard",
      "MemoButton",
      "ThemedHeader",
    ]);
  });
});
