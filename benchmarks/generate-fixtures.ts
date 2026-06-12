import fs from "node:fs";
import path from "node:path";

const TAGS = ["div", "span", "button", "input", "section", "article", "form", "label", "h1", "p"];
const PROP_NAMES = [
  "onClick",
  "onChange",
  "onSubmit",
  "children",
  "className",
  "disabled",
  "label",
  "title",
  "value",
  "placeholder",
  "name",
  "type",
  "id",
  "style",
  "checked",
  "selected",
  "loading",
  "error",
  "variant",
  "size",
];
const PROP_TYPES = ["string", "number", "boolean", "() => void", "React.ReactNode"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateComponent(index: number, rand: () => number): string {
  const name = `Component${index}`;
  const propCount = 1 + Math.floor(rand() * 5);
  const props: string[] = [];
  const propTypes: string[] = [];

  for (let i = 0; i < propCount; i++) {
    const propName = PROP_NAMES[Math.floor(rand() * PROP_NAMES.length)];
    const propType = PROP_TYPES[Math.floor(rand() * PROP_TYPES.length)];
    if (!props.includes(propName)) {
      props.push(propName);
      propTypes.push(propType);
    }
  }

  const propsInterface = props.map((n, i) => `  ${n}: ${propTypes[i]};`).join("\n");
  const tag = TAGS[Math.floor(rand() * TAGS.length)];
  const childDepth = Math.floor(rand() * 3);
  const jsx = generateJSX(tag, childDepth, rand);

  return `
interface ${name}Props {
${propsInterface}
}

export function ${name}({ ${props.join(", ")} }: ${name}Props) {
  return ${jsx};
}
`;
}

function generateJSX(tag: string, depth: number, rand: () => number): string {
  if (depth <= 0) {
    return `<${tag}>{children ?? label ?? title ?? ""}</${tag}>`;
  }
  const childTag = TAGS[Math.floor(rand() * TAGS.length)];
  const childCount = 1 + Math.floor(rand() * 3);
  const children = Array.from({ length: childCount }, () => generateJSX(childTag, depth - 1, rand));
  return `<${tag}>\n      ${children.join("\n      ")}\n    </${tag}>`;
}

function generateFixture(dir: string, count: number, seed: number) {
  const rand = seededRandom(seed);
  const components = Array.from({ length: count }, (_, i) => generateComponent(i, rand));
  const imports = 'import React from "react";\n';
  const content = imports + components.join("\n");

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "components.tsx"), content);
  fs.writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ["*.tsx"],
      },
      null,
      2,
    ),
  );

  console.log(`Generated ${count} components in ${dir}`);
}

const root = path.resolve(import.meta.dirname, "..", "fixtures");
generateFixture(path.join(root, "small"), 100, 42);
generateFixture(path.join(root, "medium"), 500, 123);
generateFixture(path.join(root, "large"), 2000, 456);
