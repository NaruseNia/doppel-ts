export interface PropsInfo {
  properties: PropProperty[];
  hasChildren: boolean;
  hasRef: boolean;
}

export interface PropProperty {
  name: string;
  type: TypeDescriptor;
  optional: boolean;
  defaultValue?: string;
}

export type TypeDescriptor =
  | { kind: "primitive"; name: string }
  | { kind: "literal"; value: string }
  | { kind: "union"; members: TypeDescriptor[] }
  | { kind: "intersection"; members: TypeDescriptor[] }
  | { kind: "array"; element: TypeDescriptor }
  | {
      kind: "function";
      params: TypeDescriptor[];
      returnType: TypeDescriptor;
    }
  | { kind: "object"; properties: PropProperty[] }
  | { kind: "reference"; name: string }
  | { kind: "generic"; name: string; args: TypeDescriptor[] };
