import { describe, it, expect } from "vitest";
import { resolveConfig } from "../src/config/loader.js";
import { validateConfig, ConfigValidationError } from "../src/config/validate.js";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";

describe("resolveConfig", () => {
  it("returns defaults when given empty config", () => {
    const resolved = resolveConfig({});
    expect(resolved).toEqual(DEFAULT_CONFIG);
  });

  it("merges user include, replaces default", () => {
    const resolved = resolveConfig({ include: ["src/**/*.tsx"] });
    expect(resolved.include).toEqual(["src/**/*.tsx"]);
  });

  it("merges user exclude with defaults", () => {
    const resolved = resolveConfig({ exclude: ["**/*.stories.tsx"] });
    expect(resolved.exclude).toContain("**/*.stories.tsx");
    expect(resolved.exclude).toContain("**/node_modules/**");
  });

  it("resolves numeric threshold to { minimum }", () => {
    const resolved = resolveConfig({ threshold: 0.8 });
    expect(resolved.threshold).toEqual({ minimum: 0.8 });
  });

  it("resolves object threshold as-is", () => {
    const resolved = resolveConfig({
      threshold: { high: 0.95, medium: 0.75 },
    });
    expect(resolved.threshold).toEqual({ high: 0.95, medium: 0.75 });
  });

  it("partial weights merge with defaults", () => {
    const resolved = resolveConfig({ weights: { props: 0.7 } });
    expect(resolved.weights.props).toBe(0.7);
    expect(resolved.weights.jsx).toBe(DEFAULT_CONFIG.weights.jsx);
  });

  it("cli overrides take precedence over user config", () => {
    const resolved = resolveConfig({ threshold: 0.7 }, { threshold: 0.9 });
    expect(resolved.threshold).toEqual({ minimum: 0.9 });
  });

  it("preserves suppress pairs", () => {
    const resolved = resolveConfig({
      suppress: [["ButtonA", "ButtonB"]],
    });
    expect(resolved.suppress).toEqual([["ButtonA", "ButtonB"]]);
  });

  it("defaults includeLocal to false", () => {
    const resolved = resolveConfig({});
    expect(resolved.includeLocal).toBe(false);
  });
});

describe("validateConfig", () => {
  it("passes with valid config", () => {
    expect(() =>
      validateConfig({
        weights: { props: 0.5, jsx: 0.3, style: 0.1, behavior: 0.1 },
        threshold: { high: 0.9, medium: 0.7 },
      }),
    ).not.toThrow();
  });

  it("rejects weights not summing to 1.0", () => {
    expect(() =>
      validateConfig({
        weights: { props: 0.5, jsx: 0.5, style: 0.5, behavior: 0.5 },
      }),
    ).toThrow(ConfigValidationError);
  });

  it("rejects negative weight", () => {
    expect(() =>
      validateConfig({
        weights: { props: -0.1, jsx: 0.6, style: 0.3, behavior: 0.2 },
      }),
    ).toThrow(ConfigValidationError);
  });

  it("rejects threshold out of range", () => {
    expect(() => validateConfig({ threshold: 1.5 })).toThrow(ConfigValidationError);
    expect(() => validateConfig({ threshold: -0.1 })).toThrow(ConfigValidationError);
  });

  it("rejects invalid suppress entries", () => {
    expect(() =>
      validateConfig({
        suppress: [["only-one"] as unknown as [string, string]],
      }),
    ).toThrow(ConfigValidationError);
  });

  it("passes with no optional fields", () => {
    expect(() => validateConfig({})).not.toThrow();
  });
});
