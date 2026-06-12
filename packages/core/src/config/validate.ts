import type { DoppelConfig } from "./schema.js";

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`doppel-ts config: ${message}`);
    this.name = "ConfigValidationError";
  }
}

export function validateConfig(config: DoppelConfig): void {
  if (config.weights) {
    const { props = 0, jsx = 0, style = 0, behavior = 0 } = config.weights;
    const sum = props + jsx + style + behavior;
    if (Math.abs(sum - 1.0) > 0.001) {
      throw new ConfigValidationError(`weights must sum to 1.0, got ${sum}`);
    }
    for (const [key, value] of Object.entries(config.weights)) {
      if (value !== undefined && (value < 0 || value > 1)) {
        throw new ConfigValidationError(`weights.${key} must be between 0 and 1, got ${value}`);
      }
    }
  }

  if (config.threshold !== undefined) {
    if (typeof config.threshold === "number") {
      if (config.threshold < 0 || config.threshold > 1) {
        throw new ConfigValidationError(
          `threshold must be between 0 and 1, got ${config.threshold}`,
        );
      }
    } else {
      for (const [key, value] of Object.entries(config.threshold)) {
        if (value < 0 || value > 1) {
          throw new ConfigValidationError(`threshold.${key} must be between 0 and 1, got ${value}`);
        }
      }
    }
  }

  if (config.suppress) {
    for (const pair of config.suppress) {
      if (!Array.isArray(pair) || pair.length !== 2) {
        throw new ConfigValidationError("suppress entries must be [string, string] tuples");
      }
    }
  }
}
