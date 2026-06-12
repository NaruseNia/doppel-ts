export interface DoppelConfig {
  include?: string[];
  exclude?: string[];
  threshold?: number | Record<string, number>;
  weights?: {
    props?: number;
    jsx?: number;
    style?: number;
    behavior?: number;
  };
  suppress?: [string, string][];
  includeLocal?: boolean;
}

export interface ResolvedConfig {
  include: string[];
  exclude: string[];
  threshold: Record<string, number>;
  weights: {
    props: number;
    jsx: number;
    style: number;
    behavior: number;
  };
  suppress: [string, string][];
  includeLocal: boolean;
}

export function defineConfig(config: DoppelConfig): DoppelConfig {
  return config;
}
