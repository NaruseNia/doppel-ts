export interface DoppelConfig {
  include?: string[];
  exclude?: string[];
  threshold?: number | { high?: number; medium?: number; [key: string]: number | undefined };
  weights?: {
    props?: number;
    jsx?: number;
    style?: number;
    behavior?: number;
  };
  suppress?: [string, string][];
  includeLocal?: boolean;
}

export function defineConfig(config: DoppelConfig): DoppelConfig {
  return config;
}
