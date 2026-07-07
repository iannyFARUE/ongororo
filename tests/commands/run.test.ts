import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runCases, loadConfig } from "../../src/commands/run";
import type { OngororoConfig } from "../../src/types";

describe("runCases", () => {
  it("runs each case through the agent and grades the output", async () => {
    const config: OngororoConfig = {
      agent: async (prompt: string) => (prompt === "Say hello" ? "Hello there!" : "4"),
      cases: [
        { name: "greets user", prompt: "Say hello", assert: { contains: "Hello" } },
        { name: "math check", prompt: "What is 2+2?", assert: { regex: /4/ } },
      ],
    };

    const summary = await runCases(config);

    expect(summary.passed).toBe(2);
    expect(summary.failed).toBe(0);
    expect(summary.results).toEqual([
      { name: "greets user", passed: true, output: "Hello there!" },
      { name: "math check", passed: true, output: "4" },
    ]);
  });

  it("marks a case as failed when the assertion does not match", async () => {
    const config: OngororoConfig = {
      agent: async () => "wrong answer",
      cases: [{ name: "math check", prompt: "What is 2+2?", assert: { regex: /4/ } }],
    };

    const summary = await runCases(config);

    expect(summary.passed).toBe(0);
    expect(summary.failed).toBe(1);
    expect(summary.results[0].passed).toBe(false);
  });
});

describe("loadConfig", () => {
  let tmpDir: string | undefined;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  });

  it("loads a CommonJS config file from disk", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ongororo-"));
    const configPath = path.join(tmpDir, "ongororo.config.js");
    fs.writeFileSync(
      configPath,
      'module.exports = { agent: async () => "hi", cases: [] };\n',
      "utf8"
    );

    const config = loadConfig(configPath);

    expect(config.cases).toEqual([]);
    expect(typeof config.agent).toBe("function");
  });

  it("throws a clear error when the config file does not exist", () => {
    const missingPath = path.join(os.tmpdir(), "definitely-does-not-exist", "ongororo.config.js");
    expect(() => loadConfig(missingPath)).toThrow(/Config file not found/);
  });
});
