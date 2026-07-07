import { describe, it, expect } from "vitest";
import { grade } from "../src/grader";

describe("grade", () => {
  it("grades a contains assertion", () => {
    expect(grade("Hello there!", { contains: "Hello" })).toBe(true);
  });

  it("grades a notContains assertion", () => {
    expect(grade("Hello there!", { notContains: "Goodbye" })).toBe(true);
  });

  it("grades a regex assertion", () => {
    expect(grade("The answer is 4", { regex: /4/ })).toBe(true);
  });

  it("grades an equals assertion", () => {
    expect(grade("4", { equals: "4" })).toBe(true);
  });

  it("throws for an unrecognized assertion shape", () => {
    expect(() =>
      // @ts-expect-error - intentionally invalid assertion for runtime check
      grade("output", { unknown: "x" })
    ).toThrow(/Unknown assertion type/);
  });
});
