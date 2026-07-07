import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initCommand } from "../src/commands/init";
import { loadConfig, runCases } from "../src/commands/run";

describe("init -> run integration", () => {
  let tmpDir: string | undefined;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  });

  it("scaffolds a config that passes all its own example cases out of the box", async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ongororo-integration-"));
    const initResult = initCommand(tmpDir);
    expect(initResult.created).toBe(true);

    const config = loadConfig(initResult.path);
    const summary = await runCases(config);

    expect(summary.passed).toBe(2);
    expect(summary.failed).toBe(0);
  });
});
