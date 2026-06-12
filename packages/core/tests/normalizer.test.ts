import path from "node:path";
import { describe, it, expect, beforeAll } from "vitest";
import ts from "typescript";
import { detectComponents } from "../src/detector/index.js";
import { extractProps } from "../src/extractor/props.js";
import { extractJSXTree } from "../src/extractor/jsx-tree.js";
import { normalizeComponent, normalizeAll } from "../src/normalizer/index.js";
import type { ComponentInfo } from "../src/types/component.js";

const FIXTURES_DIR = path.resolve(import.meta.dirname, "fixtures");
const FIXTURE_FILE = path.join(FIXTURES_DIR, "components.tsx");
const TSCONFIG_PATH = path.join(FIXTURES_DIR, "tsconfig.json");

let components: ComponentInfo[];
let program: ts.Program;
let checker: ts.TypeChecker;

beforeAll(() => {
  const configFile = ts.readConfigFile(TSCONFIG_PATH, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, FIXTURES_DIR);
  program = ts.createProgram([FIXTURE_FILE], parsed.options);
  checker = program.getTypeChecker();
  components = detectComponents([FIXTURE_FILE], program, checker);
});

describe("normalizeComponent", () => {
  it("produces NormalizedComponentData with correct id", () => {
    const comp = components.find((c) => c.name === "Button")!;
    const props = extractProps(comp, program, checker);
    const jsx = extractJSXTree(comp, program);
    const normalized = normalizeComponent(comp, props, jsx, program);

    expect(normalized.id).toContain("Button");
    expect(normalized.name).toBe("Button");
    expect(normalized.line).toBeGreaterThan(0);
  });

  it("normalizes props with type signatures", () => {
    const comp = components.find((c) => c.name === "Button")!;
    const props = extractProps(comp, program, checker);
    const jsx = extractJSXTree(comp, program);
    const normalized = normalizeComponent(comp, props, jsx, program);

    expect(normalized.props.propertyCount).toBeGreaterThan(0);
    for (const prop of normalized.props.properties) {
      expect(typeof prop.name).toBe("string");
      expect(typeof prop.typeSignature).toBe("string");
      expect(prop.typeSignature.length).toBeGreaterThan(0);
    }
  });

  it("includes jsxTree", () => {
    const comp = components.find((c) => c.name === "Button")!;
    const props = extractProps(comp, program, checker);
    const jsx = extractJSXTree(comp, program);
    const normalized = normalizeComponent(comp, props, jsx, program);

    expect(normalized.jsxTree.root.kind).toBe("element");
  });

  it("is JSON serializable", () => {
    const comp = components.find((c) => c.name === "Button")!;
    const props = extractProps(comp, program, checker);
    const jsx = extractJSXTree(comp, program);
    const normalized = normalizeComponent(comp, props, jsx, program);

    const json = JSON.stringify(normalized);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe(normalized.id);
    expect(parsed.props.propertyCount).toBe(normalized.props.propertyCount);
  });
});

describe("normalizeAll", () => {
  it("normalizes all components", () => {
    const result = normalizeAll(
      components,
      (c) => extractProps(c, program, checker),
      (c) => extractJSXTree(c, program),
      program,
    );

    expect(result.length).toBe(components.length);
    for (const item of result) {
      expect(item.id).toBeTruthy();
      expect(item.props).toBeDefined();
      expect(item.jsxTree).toBeDefined();
    }
  });

  it("batch output is fully JSON serializable", () => {
    const result = normalizeAll(
      components,
      (c) => extractProps(c, program, checker),
      (c) => extractJSXTree(c, program),
      program,
    );

    const json = JSON.stringify({ components: result });
    const parsed = JSON.parse(json);
    expect(parsed.components.length).toBe(components.length);
  });
});
