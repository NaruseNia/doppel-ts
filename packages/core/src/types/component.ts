export interface ComponentInfo {
  name: string;
  filePath: string;
  line: number;
  column: number;
  exportType: "named" | "default";
  wrappers: WrapperType[];
  isLocal: boolean;
}

export type WrapperType = "memo" | "forwardRef" | { hoc: string };
