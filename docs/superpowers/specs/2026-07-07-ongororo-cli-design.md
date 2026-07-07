# ongororo — design

## Purpose

A learning project: build a small, real CLI tool for evaluating agent outputs, and publish it to the public npm registry. The primary goal is understanding the mechanics of npm package publishing (package.json fields, build step, bin entries, versioning, `npm publish`); the eval-runner functionality is the vehicle, not the end in itself. No existing real agent needs to be evaluated — a mock agent ships with the tool so it works out of the box.

## Package

- Name: `ongororo` (confirmed available, unscoped)
- Written in TypeScript, compiled to `dist/` via `tsc`
- Publishable as both a CLI (`bin`) and an importable library (`main` + `types`) exposing the assertion/grading functions

## CLI

Two subcommands:

- `ongororo init`
  - Writes `ongororo.config.js` into the current directory.
  - Refuses to overwrite an existing config file.
  - Scaffolded config includes a mock `agent` function (echoes/returns canned responses — no API key required) and two example cases.

- `ongororo run [path]`
  - Defaults to `./ongororo.config.js` if no path is given.
  - Loads the config, runs `agent(prompt)` for each case, grades the result against its `assert`.
  - Prints a colored per-case pass/fail line, then a summary line (e.g. `3 passed, 1 failed`).
  - Exits with code 1 if any case failed (CI-friendly), 0 otherwise.

Implemented with `commander` for argument parsing and `picocolors` (or equivalent tiny lib) for colored output — both small, standard runtime dependencies.

## Config format

Plain CommonJS file, no build step required for user configs:

```js
module.exports = {
  agent: async (prompt) => { /* your agent call, must return a string */ },
  cases: [
    { name: "greets user", prompt: "Say hello", assert: { contains: "hello" } },
    { name: "math check", prompt: "What is 2+2?", assert: { regex: /4/ } },
  ],
};
```

Built-in assertion types (v0.1.0): `contains`, `notContains`, `regex`, `equals`. Each assertion function is a pure function of `(output: string, expected) => boolean`, exported from the library entry point so they're independently importable/testable.

## Build & publish

- `src/` compiled by `tsc` to `dist/`. `bin` field points to `dist/cli.js` (with shebang `#!/usr/bin/env node`).
- `files` field restricted to `dist`, `README.md`, `LICENSE` — keeps the published tarball minimal.
- `prepublishOnly` script runs the build, so a stale/unbuilt `dist/` can never be published.
- Vitest unit tests cover the four assertion functions.
- Start at version `0.1.0`. Unscoped name, so `npm publish` needs no `--access` flag.
- Actually running `npm publish` is a deliberate, explicit step the user approves at the time — not automated as part of implementation.

## Out of scope (v0.1.0)

- Real LLM/agent adapters (Claude API, etc.) — left for the user to wire into their own config's `agent` function later.
- YAML/JSON config formats — JS config only.
- Parallel case execution, retries, streaming output.
- CI workflow for automated publishing (could be a future iteration).
