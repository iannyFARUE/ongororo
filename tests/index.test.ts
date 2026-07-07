import { describe, it, expect } from "vitest";
import * as ongororo from "../src/index";

describe("library entry point", () => {
  it("exports the assertion functions", () => {
    expect(typeof ongororo.contains).toBe("function");
    expect(typeof ongororo.notContains).toBe("function");
    expect(typeof ongororo.regex).toBe("function");
    expect(typeof ongororo.equals).toBe("function");
  });

  it("exports the grade function", () => {
    expect(typeof ongororo.grade).toBe("function");
  });
});
