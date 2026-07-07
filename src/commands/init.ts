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
