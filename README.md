# ongororo

A small CLI for evaluating agent outputs against configurable assertions.

## Install

```bash
npm install -g ongororo
```

## Usage

```bash
ongororo init          # scaffold ongororo.config.js in the current directory
ongororo run           # run ./ongororo.config.js
ongororo run ./path/to/config.js
```

`ongororo run` exits with code 1 if any case fails (CI-friendly), 0 otherwise.

## Config format

```js
module.exports = {
  agent: async (prompt) => { /* your agent call, must return a string */ },
  cases: [
    { name: "greets user", prompt: "Say hello", assert: { contains: "hello" } },
    { name: "math check", prompt: "What is 2+2?", assert: { regex: /4/ } },
  ],
};
```

Built-in assertion types: `contains`, `notContains`, `regex`, `equals`.

## Library usage

The assertion and grading functions are also available as an importable library:

```ts
import { contains, grade } from "ongororo";
```

## License

MIT
