import type { PropsInfo, TypeDescriptor } from "../types/props.js";
import type { NormalizedProps } from "./types.js";

export function normalizeProps(props: PropsInfo): NormalizedProps {
  return {
    properties: props.properties.map((p) => ({
      name: p.name,
      typeSignature: typeDescriptorToString(p.type),
      optional: p.optional,
    })),
    propertyCount: props.properties.length,
  };
}

function typeDescriptorToString(type: TypeDescriptor): string {
  switch (type.kind) {
    case "primitive":
      return type.name;
    case "literal":
      return type.value;
    case "reference":
      return type.name;
    case "array":
      return `${typeDescriptorToString(type.element)}[]`;
    case "union":
      return type.members.map(typeDescriptorToString).join(" | ");
    case "intersection":
      return type.members.map(typeDescriptorToString).join(" & ");
    case "function": {
      const params = type.params.map(typeDescriptorToString).join(", ");
      const ret = typeDescriptorToString(type.returnType);
      return `(${params}) => ${ret}`;
    }
    case "object": {
      const props = type.properties.map((p) => {
        const opt = p.optional ? "?" : "";
        return `${p.name}${opt}: ${typeDescriptorToString(p.type)}`;
      });
      return `{ ${props.join("; ")} }`;
    }
    case "generic":
      return `${type.name}<${type.args.map(typeDescriptorToString).join(", ")}>`;
  }
}
