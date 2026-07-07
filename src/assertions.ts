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
