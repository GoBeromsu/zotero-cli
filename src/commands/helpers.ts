import { ValidationError } from "../application/errors.js";
import type { JsonValue, LibrarySelector, ZoteroConfig } from "../application/types.js";
import { getOption, type ParsedArgs } from "../utils/args.js";

export function renderJson(value: JsonValue): string {
  return JSON.stringify(value, null, 2);
}

export function ensureNoPositionals(parsed: ParsedArgs, label: string): void {
  if (parsed.positionals.length > 0) {
    throw new ValidationError(`${label} does not accept positional arguments.`);
  }
}

export function resolveLibrary(parsed: ParsedArgs, config: ZoteroConfig): LibrarySelector {
  const group = getOption(parsed, "group");
  if (group) {
    return { type: "group", id: group };
  }
  const userId = config.userId ?? "0";
  return { type: "user", id: userId };
}

export function parseIntOption(parsed: ParsedArgs, name: string): number | undefined {
  const value = getOption(parsed, name);
  if (value === undefined) return undefined;
  const num = parseInt(value, 10);
  if (isNaN(num)) throw new ValidationError(`Option --${name} must be a number.`);
  return num;
}
