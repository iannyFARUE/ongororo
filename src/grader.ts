import { contains, notContains, regex, equals } from "./assertions";
import type { Assertion } from "./types";

export function grade(output: string, assertion: Assertion): boolean {
  if ("contains" in assertion) return contains(output, assertion.contains);
  if ("notContains" in assertion) return notContains(output, assertion.notContains);
  if ("regex" in assertion) return regex(output, assertion.regex);
  if ("equals" in assertion) return equals(output, assertion.equals);
  throw new Error(`Unknown assertion type: ${JSON.stringify(assertion)}`);
}
