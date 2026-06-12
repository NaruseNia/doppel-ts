export interface SimilarityPair {
  score: number;
  level: string;
  breakdown: {
    props: number;
    jsx: number;
    style?: number;
    behavior?: number;
  };
  componentA: ComponentSummary;
  componentB: ComponentSummary;
}

export interface ComponentSummary {
  name: string;
  filePath: string;
  line: number;
  props: Array<{ name: string; typeSignature: string; optional: boolean }>;
  jsxTree: unknown;
}

export interface AnalysisOutput {
  version: string;
  scanPaths: string[];
  totalComponents: number;
  pairs: SimilarityPair[];
  config: {
    threshold: Record<string, number>;
    weights: { props: number; jsx: number; style: number; behavior: number };
  };
}
