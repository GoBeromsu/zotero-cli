import { ValidationError } from "../application/errors.js";
import type { LibrarySelector } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  parseArgs
} from "../utils/args.js";
import { parseIntOption, renderJson, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface CollectionsInput {
  library: LibrarySelector;
  parentKey?: string;
  limit?: number;
  sort?: string;
  direction?: "asc" | "desc";
}

export class CollectionsCommand implements CommandModule<CollectionsInput> {
  readonly name = "collections";
  readonly category = "Core";
  readonly description = "List collections.";

  help(): string {
    return [
      "Usage: zt collections [<parentKey>] [options]",
      "",
      "List collections, optionally filtered by parent collection.",
      "",
      "Options:",
      "  --group <id>           Library group ID",
      "  --parent <key>         Parent collection key",
      "  --limit <n>            Maximum number of results",
      "  --sort <field>         Sort field (e.g. title, dateModified)",
      "  --direction <asc|desc> Sort direction",
      "",
      "Examples:",
      "  zt collections",
      "  zt collections --parent ABC12345",
      "  zt collections --group 123456 --limit 50"
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): CollectionsInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["group", "parent", "limit", "sort", "direction"]);
    assertNoMissingOptionValues(parsed, ["group", "parent", "limit", "sort", "direction"]);

    if (parsed.positionals.length > 1) {
      throw new ValidationError(
        "collections accepts at most one positional argument (parent key)."
      );
    }

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const parentKey = parsed.positionals[0] ?? getOption(parsed, "parent");
    const limit = parseIntOption(parsed, "limit");
    const sort = getOption(parsed, "sort");
    const direction = getOption(parsed, "direction") as "asc" | "desc" | undefined;

    return { library, parentKey, limit, sort, direction };
  }

  async execute(input: CollectionsInput, context: CommandContext): Promise<void> {
    const options: Record<string, unknown> = {};
    if (input.limit !== undefined) options.limit = input.limit;
    if (input.sort) options.sort = input.sort;
    if (input.direction) options.direction = input.direction;

    const result = await context.zotero.listCollections(
      input.library,
      input.parentKey,
      Object.keys(options).length > 0 ? options : undefined
    );
    context.output.write(renderJson(result));
  }
}
