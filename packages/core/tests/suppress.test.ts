import { describe, it, expect } from "vitest";
import { isPairSuppressed, matchesSuppressPattern } from "../src/suppress/pattern-matcher.js";

describe("matchesSuppressPattern", () => {
  it("matches exact name", () => {
    expect(matchesSuppressPattern("Button", "Button")).toBe(true);
    expect(matchesSuppressPattern("Button", "Card")).toBe(false);
  });

  it("matches wildcard prefix", () => {
    expect(matchesSuppressPattern("PrimaryButton", "*Button")).toBe(true);
    expect(matchesSuppressPattern("PrimaryCard", "*Button")).toBe(false);
  });

  it("matches wildcard suffix", () => {
    expect(matchesSuppressPattern("ButtonPrimary", "Button*")).toBe(true);
  });

  it("matches wildcard both sides", () => {
    expect(matchesSuppressPattern("MyButtonComponent", "*Button*")).toBe(true);
    expect(matchesSuppressPattern("MyCardComponent", "*Button*")).toBe(false);
  });
});

describe("isPairSuppressed", () => {
  it("suppresses exact pair", () => {
    expect(isPairSuppressed("ButtonA", "ButtonB", [["ButtonA", "ButtonB"]])).toBe(true);
  });

  it("suppresses reversed pair", () => {
    expect(isPairSuppressed("ButtonB", "ButtonA", [["ButtonA", "ButtonB"]])).toBe(true);
  });

  it("does not suppress unmatched pair", () => {
    expect(isPairSuppressed("CardA", "CardB", [["ButtonA", "ButtonB"]])).toBe(false);
  });

  it("suppresses with glob patterns", () => {
    expect(isPairSuppressed("PrimaryButton", "SecondaryBtn", [["*Button*", "*Btn*"]])).toBe(true);
  });

  it("checks multiple suppress rules", () => {
    const rules: [string, string][] = [
      ["BaseButton", "IconButton"],
      ["*Layout*", "*Container*"],
    ];
    expect(isPairSuppressed("MainLayout", "SideContainer", rules)).toBe(true);
    expect(isPairSuppressed("Header", "Footer", rules)).toBe(false);
  });
});
