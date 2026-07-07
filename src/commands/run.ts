import fs from "node:fs";
import path from "node:path";
import { grade } from "../grader";
import type { OngororoConfig } from "../types";

export interface CaseResult {
  name: string;
  passed: boolean;
  output: string;
}

export interface RunSummary {
  results: CaseResult[];
  passed: number;
  failed: number;
}

export function loadConfig(configPath: string): OngororoConfig {
  const resolved = path.resolve(configPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Config file not found: ${resolved}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(resolved) as OngororoConfig;
}

export async function runCases(config: OngororoConfig): Promise<RunSummary> {
  const results: CaseResult[] = [];

  for (const c of config.cases) {
    const output = await config.agent(c.prompt);
    const passed = grade(output, c.assert);
    results.push({ name: c.name, passed, output });
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  return { results, passed, failed };
}
