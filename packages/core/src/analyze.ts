export interface AnalyzeOptions {
  paths: string[];
  exclude?: string[];
  threshold?: number;
}

export interface AnalyzeResult {
  totalComponents: number;
  pairs: unknown[];
}

export async function analyze(_options: AnalyzeOptions): Promise<AnalyzeResult> {
  return {
    totalComponents: 0,
    pairs: [],
  };
}
