import path from "node:path";
import { describe, it, expect, beforeAll } from "vitest";
import ts from "typescript";
import { detectComponents } from "../src/detector/index.js";
import { extractJSXTree } from "../src/extractor/jsx-tree.js";
import type { ComponentInfo } from "../src/types/component.js";
import type { NormalizedJSXTree, JSXNode } from "../src/types/jsx.js";

const FIXTURES_DIR = path.resolve(import.meta.dirname, "fixtures");
const FIXTURE_FILE = path.join(FIXTURES_DIR, "components.tsx");
const TSCONFIG_PATH = path.join(FIXTURES_DIR, "tsconfig.json");

let components: ComponentInfo[];
let program: ts.Program;

function treeFor(name: string): NormalizedJSXTree {
  const comp = components.find((c) => c.name === name);
  if (!comp) throw new Error(`Component ${name} not found`);
  return extractJSXTree(comp, program);
}

beforeAll(() => {
  const configFile = ts.readConfigFile(TSCONFIG_PATH, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, FIXTURES_DIR);
  program = ts.createProgram([FIXTURE_FILE], parsed.options);
  const checker = program.getTypeChecker();
  components = detectComponents([FIXTURE_FILE], program, checker);
});

describe("extractJSXTree", () => {
  it("extracts element with tag and attributes", () => {
    const tree = treeFor("Button");
    expect(tree.root.kind).toBe("element");
    if (tree.root.kind === "element") {
      expect(tree.root.tag).toBe("button");
      expect(tree.root.isComponent).toBe(false);
      expect(tree.root.attributes.some((a) => a.name === "onClick")).toBe(true);
    }
  });

  it("extracts simple element from Badge", () => {
    const tree = treeFor("Badge");
    expect(tree.root.kind).toBe("element");
    if (tree.root.kind === "element") {
      expect(tree.root.tag).toBe("span");
    }
  });

  it("extracts JSX from memo wrapped component", () => {
    const tree = treeFor("MemoButton");
    expect(tree.root.kind).toBe("element");
    if (tree.root.kind === "element") {
      expect(tree.root.tag).toBe("button");
    }
  });

  it("extracts JSX from forwardRef component", () => {
    const tree = treeFor("InputField");
    expect(tree.root.kind).toBe("element");
    if (tree.root.kind === "element") {
      expect(tree.root.tag).toBe("input");
      expect(tree.root.attributes.some((a) => a.name === "ref")).toBe(true);
    }
  });

  it("extracts JSX from nested memo+forwardRef", () => {
    const tree = treeFor("FancyInput");
    expect(tree.root.kind).toBe("element");
    if (tree.root.kind === "element") {
      expect(tree.root.tag).toBe("label");
      expect(tree.root.children.length).toBeGreaterThan(0);
    }
  });

  it("extracts JSX from class component render method", () => {
    const tree = treeFor("Counter");
    expect(tree.root.kind).toBe("element");
    if (tree.root.kind === "element") {
      expect(tree.root.tag).toBe("div");
    }
  });

  it("marks component tags as isComponent", () => {
    const tree = treeFor("FancyInput");
    function findComponents(node: JSXNode): string[] {
      const result: string[] = [];
      if (node.kind === "element") {
        if (node.isComponent) result.push(node.tag);
        for (const child of node.children) result.push(...findComponents(child));
      }
      if (node.kind === "fragment") {
        for (const child of node.children) result.push(...findComponents(child));
      }
      return result;
    }
    // FancyInput contains <label> and <input>, no component tags
    const compTags = findComponents(tree.root);
    expect(compTags).toEqual([]);
  });

  it("extracts default export JSX", () => {
    const tree = treeFor("InternalCard");
    expect(tree.root.kind).toBe("element");
    if (tree.root.kind === "element") {
      expect(tree.root.tag).toBe("div");
    }
  });
});
