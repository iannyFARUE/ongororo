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
