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
