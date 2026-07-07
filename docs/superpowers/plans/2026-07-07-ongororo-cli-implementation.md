# ongororo CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish-ready-package the `ongororo` npm CLI: a TypeScript tool with `init` and `run` subcommands that scaffolds and executes a mock-agent evaluation config, teaching the mechanics of npm packaging along the way.

**Architecture:** A small TypeScript library (`src/assertions.ts`, `src/grader.ts`, `src/types.ts`) exposes pure, independently-testable grading functions and is re-exported from `src/index.ts` as the package's library entry point. `src/commands/init.ts` and `src/commands/run.ts` hold the I/O logic for each subcommand, returning plain data so their core logic is unit-testable without capturing stdout. `src/cli.ts` is a thin `commander`-based wrapper that wires the commands together, handles printing and exit codes, and compiles to the package's `bin` entry.

**Tech Stack:** TypeScript (compiled via `tsc`), `commander` (CLI parsing), `picocolors` (colored output), Vitest (unit tests), Node.js `fs`/`path`/`os` built-ins.

## Global Constraints

- Package name `ongororo`, unscoped, starting at version `0.1.0`.
- `src/` compiles via `tsc` to `dist/`; `bin` field points at `dist/cli.js` with a `#!/usr/bin/env node` shebang.
- `files` field in `package.json` is restricted to `["dist", "README.md", "LICENSE"]`.
- `prepublishOnly` script runs the build so a stale `dist/` can never be published.
- User config files (`ongororo.config.js`) are plain CommonJS — no build step for users, loaded via `require()`.
- Built-in assertion types for v0.1.0: `contains`, `notContains`, `regex`, `equals` — each a pure `(output: string, expected) => boolean` function, independently exported from the library entry point.
- Out of scope for v0.1.0 — do not build: real LLM/agent adapters, YAML/JSON config formats, parallel case execution/retries/streaming, CI workflow for automated publishing.
- Actually running `npm publish` is a manual step the user takes later — never automate or invoke it as part of this plan.

---

### Task 1: Project scaffolding & build pipeline

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `src/index.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a working `tsc` build pipeline. Later tasks add files under `src/` and `tests/` that this pipeline compiles/runs. `npm run build` compiles `src/` to `dist/`; `npm test` runs Vitest.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "ongororo",
  "version": "0.1.0",
  "description": "A small CLI for evaluating agent outputs against configurable assertions.",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "ongororo": "dist/cli.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build",
    "test": "vitest run"
  },
  "engines": {
    "node": ">=18"
  },
  "license": "MIT",
  "dependencies": {
    "commander": "^12.1.0",
    "picocolors": "^1.0.1"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vitest": "^1.6.0",
    "@types/node": "^20.14.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
*.log
```

- [ ] **Step 4: Create `LICENSE`**

```
MIT License

Copyright (c) 2026 Ian Farai Madhara

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 5: Create placeholder `src/index.ts`**

```ts
export const version = "0.1.0";
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` created, no errors.

- [ ] **Step 7: Verify the build pipeline works**

Run: `npm run build`
Expected: `dist/index.js` and `dist/index.d.ts` created, no `tsc` errors.

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json .gitignore LICENSE src/index.ts package-lock.json
git commit -m "chore: scaffold ongororo package and build pipeline"
```

---

### Task 2: Types & assertion functions

**Files:**
- Create: `src/types.ts`
- Create: `src/assertions.ts`
- Test: `tests/assertions.test.ts`

**Interfaces:**
- Consumes: nothing new (only Node/TS builtins)
- Produces:
  - `src/types.ts` exports: `ContainsAssertion { contains: string }`, `NotContainsAssertion { notContains: string }`, `RegexAssertion { regex: RegExp }`, `EqualsAssertion { equals: string }`, `Assertion = ContainsAssertion | NotContainsAssertion | RegexAssertion | EqualsAssertion`, `Case { name: string; prompt: string; assert: Assertion }`, `OngororoConfig { agent: (prompt: string) => Promise<string>; cases: Case[] }`.
  - `src/assertions.ts` exports: `contains(output: string, expected: string): boolean`, `notContains(output: string, expected: string): boolean`, `regex(output: string, expected: RegExp): boolean`, `equals(output: string, expected: string): boolean`.
  - Task 3 (`grader.ts`) imports both of these files.

- [ ] **Step 1: Write the failing tests**

Create `tests/assertions.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/assertions.test.ts`
Expected: FAIL — `Cannot find module '../src/assertions'` (module doesn't exist yet).

- [ ] **Step 3: Create `src/types.ts`**

```ts
export interface ContainsAssertion {
  contains: string;
}

export interface NotContainsAssertion {
  notContains: string;
}

export interface RegexAssertion {
  regex: RegExp;
}

export interface EqualsAssertion {
  equals: string;
}

export type Assertion =
  | ContainsAssertion
  | NotContainsAssertion
  | RegexAssertion
  | EqualsAssertion;

export interface Case {
  name: string;
  prompt: string;
  assert: Assertion;
}

export interface OngororoConfig {
  agent: (prompt: string) => Promise<string>;
  cases: Case[];
}
```

- [ ] **Step 4: Create `src/assertions.ts`**

```ts
export function contains(output: string, expected: string): boolean {
  return output.includes(expected);
}

export function notContains(output: string, expected: string): boolean {
  return !output.includes(expected);
}

export function regex(output: string, expected: RegExp): boolean {
  return expected.test(output);
}

export function equals(output: string, expected: string): boolean {
  return output === expected;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/assertions.test.ts`
Expected: PASS — 8 tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/assertions.ts tests/assertions.test.ts
git commit -m "feat: add assertion types and grading functions"
```

---

### Task 3: Grader

**Files:**
- Create: `src/grader.ts`
- Test: `tests/grader.test.ts`

**Interfaces:**
- Consumes: `Assertion` type and `contains`/`notContains`/`regex`/`equals` from Task 2 (`src/types.ts`, `src/assertions.ts`).
- Produces: `grade(output: string, assertion: Assertion): boolean`, throwing `Error("Unknown assertion type: " + JSON.stringify(assertion))` for an unrecognized shape. Task 4 (library entry) and Task 6 (`run` command) both import `grade`.

- [ ] **Step 1: Write the failing tests**

Create `tests/grader.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/grader.test.ts`
Expected: FAIL — `Cannot find module '../src/grader'`.

- [ ] **Step 3: Create `src/grader.ts`**

```ts
import { contains, notContains, regex, equals } from "./assertions";
import type { Assertion } from "./types";

export function grade(output: string, assertion: Assertion): boolean {
  if ("contains" in assertion) return contains(output, assertion.contains);
  if ("notContains" in assertion) return notContains(output, assertion.notContains);
  if ("regex" in assertion) return regex(output, assertion.regex);
  if ("equals" in assertion) return equals(output, assertion.equals);
  throw new Error(`Unknown assertion type: ${JSON.stringify(assertion)}`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/grader.test.ts`
Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/grader.ts tests/grader.test.ts
git commit -m "feat: add grader that dispatches assertions to grading functions"
```

---

### Task 4: Library entry point

**Files:**
- Modify: `src/index.ts`
- Test: `tests/index.test.ts`

**Interfaces:**
- Consumes: `contains`, `notContains`, `regex`, `equals` from `src/assertions.ts` (Task 2); `grade` from `src/grader.ts` (Task 3); all types from `src/types.ts` (Task 2).
- Produces: `src/index.ts` as the package's `main`/`types` entry, re-exporting the above. Task 7 doesn't import from it directly, but it's the public library surface published to npm.

- [ ] **Step 1: Write the failing test**

Create `tests/index.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/index.test.ts`
Expected: FAIL — `ongororo.contains` is `undefined` (index.ts only exports `version` so far).

- [ ] **Step 3: Replace `src/index.ts` contents**

```ts
export { contains, notContains, regex, equals } from "./assertions";
export { grade } from "./grader";
export type {
  Assertion,
  Case,
  OngororoConfig,
  ContainsAssertion,
  NotContainsAssertion,
  RegexAssertion,
  EqualsAssertion,
} from "./types";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/index.test.ts`
Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts tests/index.test.ts
git commit -m "feat: re-export assertions and grader from the library entry point"
```

---

### Task 5: `init` command

**Files:**
- Create: `src/commands/init.ts`
- Test: `tests/commands/init.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (only Node `fs`/`path` builtins).
- Produces: `initCommand(targetDir: string): { created: boolean; path: string }`. Task 7 (`cli.ts`) imports `initCommand` and turns its return value into console output and an exit code.

- [ ] **Step 1: Write the failing tests**

Create `tests/commands/init.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/commands/init.test.ts`
Expected: FAIL — `Cannot find module '../../src/commands/init'`.

- [ ] **Step 3: Create `src/commands/init.ts`**

```ts
import fs from "node:fs";
import path from "node:path";

const CONFIG_TEMPLATE = `module.exports = {
  agent: async (prompt) => {
    // Mock agent - replace with a real agent call when you're ready.
    if (/hello/i.test(prompt)) return "Hello there!";
    if (/2\\s*\\+\\s*2/.test(prompt)) return "4";
    return "I don't know.";
  },
  cases: [
    { name: "greets user", prompt: "Say hello", assert: { contains: "hello" } },
    { name: "math check", prompt: "What is 2+2?", assert: { regex: /4/ } },
  ],
};
`;

export interface InitResult {
  created: boolean;
  path: string;
}

export function initCommand(targetDir: string): InitResult {
  const configPath = path.join(targetDir, "ongororo.config.js");

  if (fs.existsSync(configPath)) {
    return { created: false, path: configPath };
  }

  fs.writeFileSync(configPath, CONFIG_TEMPLATE, "utf8");
  return { created: true, path: configPath };
}
```

Note: in the template string, `\\s` produces a literal `\s` in the written file (a real regex escape in the generated config), and `2+2` in the assertion test above matches the literal `2+2` in the scaffolded case's prompt.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/commands/init.test.ts`
Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/commands/init.ts tests/commands/init.test.ts
git commit -m "feat: add init command that scaffolds ongororo.config.js"
```

---

### Task 6: `run` command core logic

**Files:**
- Create: `src/commands/run.ts`
- Test: `tests/commands/run.test.ts`

**Interfaces:**
- Consumes: `grade` from `src/grader.ts` (Task 3); `OngororoConfig`, `Case` types from `src/types.ts` (Task 2).
- Produces: `loadConfig(configPath: string): OngororoConfig` (throws `Error("Config file not found: " + resolvedPath)` if missing) and `runCases(config: OngororoConfig): Promise<RunSummary>` where `RunSummary = { results: CaseResult[]; passed: number; failed: number }` and `CaseResult = { name: string; passed: boolean; output: string }`. Task 7 (`cli.ts`) imports both `loadConfig` and `runCases`.

- [ ] **Step 1: Write the failing tests**

Create `tests/commands/run.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/commands/run.test.ts`
Expected: FAIL — `Cannot find module '../../src/commands/run'`.

- [ ] **Step 3: Create `src/commands/run.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/commands/run.test.ts`
Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/commands/run.ts tests/commands/run.test.ts
git commit -m "feat: add run command core logic (config loading and case execution)"
```

---

### Task 7: CLI wiring, README, and end-to-end verification

**Files:**
- Create: `src/cli.ts`
- Create: `README.md`

**Interfaces:**
- Consumes: `initCommand` from `src/commands/init.ts` (Task 5); `loadConfig`, `runCases` from `src/commands/run.ts` (Task 6).
- Produces: the compiled `dist/cli.js`, which `package.json`'s `bin.ongororo` (Task 1) points at. This is the last task — nothing downstream depends on it.

- [ ] **Step 1: Create `src/cli.ts`**

```ts
#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { initCommand } from "./commands/init";
import { loadConfig, runCases } from "./commands/run";

const program = new Command();

program
  .name("ongororo")
  .description("A small CLI for evaluating agent outputs")
  .version("0.1.0");

program
  .command("init")
  .description("Scaffold an ongororo.config.js in the current directory")
  .action(() => {
    const result = initCommand(process.cwd());
    if (!result.created) {
      console.error(`ongororo.config.js already exists at ${result.path}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Created ${result.path}`);
  });

program
  .command("run [path]")
  .description("Run the cases in an ongororo config file")
  .action(async (configPath: string = "./ongororo.config.js") => {
    let config;
    try {
      config = loadConfig(configPath);
    } catch (err) {
      console.error((err as Error).message);
      process.exitCode = 1;
      return;
    }

    const summary = await runCases(config);
    for (const result of summary.results) {
      console.log(result.passed ? pc.green(`✓ ${result.name}`) : pc.red(`✗ ${result.name}`));
    }
    console.log(`\n${summary.passed} passed, ${summary.failed} failed`);
    process.exitCode = summary.failed > 0 ? 1 : 0;
  });

program.parse();
```

- [ ] **Step 2: Build the project**

Run: `npm run build`
Expected: `dist/cli.js` created alongside the other compiled files, no `tsc` errors.

- [ ] **Step 3: Manually verify `init` end-to-end**

Run (from a scratch directory, e.g. inside the OS temp dir so it doesn't touch the repo):

```bash
mkdir -p /tmp/ongororo-smoke && cd /tmp/ongororo-smoke
node /path/to/ongororo/dist/cli.js init
cat ongororo.config.js
```

Expected: `ongororo.config.js` is created and printed, containing `module.exports`, the mock `agent`, and the two example cases.

- [ ] **Step 4: Manually verify `run` end-to-end (passing case)**

Run (still in `/tmp/ongororo-smoke`):

```bash
node /path/to/ongororo/dist/cli.js run
echo "exit code: $?"
```

Expected: two green `✓` lines (`greets user`, `math check`), summary line `2 passed, 0 failed`, `exit code: 0`.

- [ ] **Step 5: Manually verify `run` end-to-end (failing case)**

Edit `/tmp/ongororo-smoke/ongororo.config.js`, change the `math check` case's `assert` to `{ contains: "nope" }`, then:

```bash
node /path/to/ongororo/dist/cli.js run
echo "exit code: $?"
```

Expected: one green `✓` (`greets user`), one red `✗` (`math check`), summary line `1 passed, 1 failed`, `exit code: 1`.

- [ ] **Step 6: Manually verify `init` refuses to overwrite**

Still in `/tmp/ongororo-smoke` (config file already exists from Step 3):

```bash
node /path/to/ongororo/dist/cli.js init
echo "exit code: $?"
```

Expected: prints `ongororo.config.js already exists at ...`, `exit code: 1`, file contents unchanged.

- [ ] **Step 7: Create `README.md`**

```markdown
# ongororo

A small CLI for evaluating agent outputs against configurable assertions.

## Install

\`\`\`bash
npm install -g ongororo
\`\`\`

## Usage

\`\`\`bash
ongororo init          # scaffold ongororo.config.js in the current directory
ongororo run           # run ./ongororo.config.js
ongororo run ./path/to/config.js
\`\`\`

`ongororo run` exits with code 1 if any case fails (CI-friendly), 0 otherwise.

## Config format

\`\`\`js
module.exports = {
  agent: async (prompt) => { /* your agent call, must return a string */ },
  cases: [
    { name: "greets user", prompt: "Say hello", assert: { contains: "hello" } },
    { name: "math check", prompt: "What is 2+2?", assert: { regex: /4/ } },
  ],
};
\`\`\`

Built-in assertion types: `contains`, `notContains`, `regex`, `equals`.

## Library usage

The assertion and grading functions are also available as an importable library:

\`\`\`ts
import { contains, grade } from "ongororo";
\`\`\`

## License

MIT
```

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: all test files pass (assertions, grader, index, commands/init, commands/run).

- [ ] **Step 9: Commit**

```bash
git add src/cli.ts README.md
git commit -m "feat: wire up the ongororo CLI with commander and colored output"
```

---

## Self-Review Notes

- **Spec coverage:** `init`/`run` subcommands (Tasks 5–7), overwrite refusal (Task 5), mock agent + two example cases (Task 5), default config path (Task 7), colored per-case + summary output and exit codes (Task 7), `commander`/`picocolors` deps (Task 1, used in Task 7), CJS config format (Tasks 5–6), four assertion types as independently exported pure functions (Tasks 2–4), `tsc` build to `dist/` with shebang'd `bin` (Tasks 1, 7), restricted `files` field and `prepublishOnly` (Task 1), Vitest coverage of the four assertion functions (Task 2), version `0.1.0` unscoped (Task 1). Out-of-scope items (real adapters, YAML/JSON config, parallel execution, CI publish automation, actual `npm publish`) are called out in Global Constraints and deliberately have no task.
- **Placeholder scan:** none found — every step has complete code or an exact command with expected output.
- **Type consistency:** `Assertion`/`Case`/`OngororoConfig` defined once in Task 2 and reused verbatim by Tasks 3, 4, 6, 7; `RunSummary`/`CaseResult` defined once in Task 6 and consumed as-is by Task 7; `initCommand`'s `InitResult` defined in Task 5 and consumed as-is by Task 7.
