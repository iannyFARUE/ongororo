import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initCommand } from "../../src/commands/init";

let tmpDir: string | undefined;

afterEach(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  tmpDir = undefined;
});

describe("initCommand", () => {
  it("creates ongororo.config.js in the target directory", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ongororo-"));
    const result = initCommand(tmpDir);

    expect(result.created).toBe(true);
    const configPath = path.join(tmpDir, "ongororo.config.js");
    expect(result.path).toBe(configPath);
    expect(fs.existsSync(configPath)).toBe(true);
    const contents = fs.readFileSync(configPath, "utf8");
    expect(contents).toContain("module.exports");
    expect(contents).toContain("cases");
  });

  it("refuses to overwrite an existing config file", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ongororo-"));
    const configPath = path.join(tmpDir, "ongororo.config.js");
    fs.writeFileSync(configPath, "// existing config\n", "utf8");

    const result = initCommand(tmpDir);

    expect(result.created).toBe(false);
    expect(fs.readFileSync(configPath, "utf8")).toBe("// existing config\n");
  });
});
