import { ValidationError } from "../application/errors.js";

export interface ParsedArgs {
  readonly positionals: string[];
  readonly options: Map<string, string[]>;
  readonly booleans: Set<string>;
}

export function parseArgs(tokens: string[]): ParsedArgs {
  const positionals: string[] = [];
  const options = new Map<string, string[]>();
  const booleans = new Set<string>();

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    if (!token.startsWith("--")) { positionals.push(token); continue; }
    const optionToken = token.slice(2);
    if (!optionToken) throw new ValidationError(`Invalid option: ${token}`);
    const equalsIndex = optionToken.indexOf("=");
    if (equalsIndex >= 0) {
      const key = optionToken.slice(0, equalsIndex);
      const value = optionToken.slice(equalsIndex + 1);
      appendOption(options, key, value);
      continue;
    }
    const next = tokens[index + 1];
    if (!next || next.startsWith("--")) { booleans.add(optionToken); continue; }
    appendOption(options, optionToken, next);
    index += 1;
  }
  return { positionals, options, booleans };
}

export function getOption(parsed: ParsedArgs, name: string): string | undefined {
  return parsed.options.get(name)?.at(-1);
}

export function getOptions(parsed: ParsedArgs, name: string): string[] {
  return parsed.options.get(name) ?? [];
}

export function hasBoolean(parsed: ParsedArgs, name: string): boolean {
  return parsed.booleans.has(name);
}

export function assertNoUnknownOptions(parsed: ParsedArgs, allowed: readonly string[]): void {
  const allowedSet = new Set(allowed);
  for (const key of parsed.options.keys()) {
    if (!allowedSet.has(key)) throw new ValidationError(`Unknown option: --${key}`);
  }
  for (const key of parsed.booleans) {
    if (!allowedSet.has(key)) throw new ValidationError(`Unknown option: --${key}`);
  }
}

export function assertNoMissingOptionValues(parsed: ParsedArgs, optionNames: readonly string[]): void {
  for (const name of optionNames) {
    if (parsed.booleans.has(name)) throw new ValidationError(`Option --${name} requires a value.`);
  }
}

function appendOption(map: Map<string, string[]>, key: string, value: string): void {
  const existing = map.get(key);
  if (!existing) { map.set(key, [value]); return; }
  existing.push(value);
}
