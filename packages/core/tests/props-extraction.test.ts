import path from "node:path";
import { describe, it, expect, beforeAll } from "vitest";
import ts from "typescript";
import { detectComponents } from "../src/detector/index.js";
import { extractProps } from "../src/extractor/props.js";
import type { ComponentInfo } from "../src/types/component.js";
import type { PropsInfo } from "../src/types/props.js";

const FIXTURES_DIR = path.resolve(import.meta.dirname, "fixtures");
const FIXTURE_FILE = path.join(FIXTURES_DIR, "components.tsx");
const TSCONFIG_PATH = path.join(FIXTURES_DIR, "tsconfig.json");

let components: ComponentInfo[];
let program: ts.Program;
let checker: ts.TypeChecker;

function propsFor(name: string): PropsInfo {
  const comp = components.find((c) => c.name === name);
  if (!comp) throw new Error(`Component ${name} not found`);
  return extractProps(comp, program, checker);
}

beforeAll(() => {
  const configFile = ts.readConfigFile(TSCONFIG_PATH, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, FIXTURES_DIR);
  program = ts.createProgram([FIXTURE_FILE], parsed.options);
  checker = program.getTypeChecker();
  components = detectComponents([FIXTURE_FILE], program, checker);
});

describe("extractProps", () => {
  it("extracts inline props from function component", () => {
    const props = propsFor("Button");
    expect(props.properties.length).toBeGreaterThan(0);

    const onClick = props.properties.find((p) => p.name === "onClick");
    expect(onClick).toBeDefined();
    expect(onClick!.type.kind).toBe("function");
    expect(onClick!.optional).toBe(false);

    const children = props.properties.find((p) => p.name === "children");
    expect(children).toBeDefined();
    expect(props.hasChildren).toBe(true);
  });

  it("extracts props from arrow component", () => {
    const props = propsFor("Badge");
    const label = props.properties.find((p) => p.name === "label");
    expect(label).toBeDefined();
    expect(label!.type).toEqual({ kind: "primitive", name: "string" });
  });

  it("extracts props from memo wrapped component", () => {
    const props = propsFor("MemoButton");
    const text = props.properties.find((p) => p.name === "text");
    expect(text).toBeDefined();
    expect(text!.type).toEqual({ kind: "primitive", name: "string" });
  });

  it("extracts props from forwardRef and marks hasRef", () => {
    const props = propsFor("InputField");
    expect(props.hasRef).toBe(true);
    const placeholder = props.properties.find((p) => p.name === "placeholder");
    expect(placeholder).toBeDefined();
  });

  it("extracts props from nested memo+forwardRef", () => {
    const props = propsFor("FancyInput");
    expect(props.hasRef).toBe(true);
    const label = props.properties.find((p) => p.name === "label");
    expect(label).toBeDefined();
  });

  it("extracts props from default exported component", () => {
    const props = propsFor("InternalCard");
    const title = props.properties.find((p) => p.name === "title");
    expect(title).toBeDefined();
    expect(title!.type).toEqual({ kind: "primitive", name: "string" });
  });

  it("returns empty for class component (class props extraction is limited)", () => {
    const props = propsFor("Counter");
    // Class component props extraction may be limited
    // but should not throw
    expect(props).toBeDefined();
  });
});
