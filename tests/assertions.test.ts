import { describe, it, expect } from "vitest";
import { contains, notContains, regex, equals } from "../src/assertions";

describe("contains", () => {
  it("returns true when output includes the expected substring", () => {
    expect(contains("Hello there!", "Hello")).toBe(true);
  });

  it("returns false when output does not include the expected substring", () => {
    expect(contains("Hello there!", "Goodbye")).toBe(false);
  });
});

describe("notContains", () => {
  it("returns true when output does not include the substring", () => {
    expect(notContains("Hello there!", "Goodbye")).toBe(true);
  });

  it("returns false when output includes the substring", () => {
    expect(notContains("Hello there!", "Hello")).toBe(false);
  });
});

describe("regex", () => {
  it("returns true when output matches the pattern", () => {
    expect(regex("The answer is 4", /4/)).toBe(true);
  });

  it("returns false when output does not match the pattern", () => {
    expect(regex("The answer is 5", /4/)).toBe(false);
  });
});

describe("equals", () => {
  it("returns true when output exactly matches expected", () => {
    expect(equals("4", "4")).toBe(true);
  });

  it("returns false when output does not exactly match expected", () => {
    expect(equals("4", "5")).toBe(false);
  });
});
