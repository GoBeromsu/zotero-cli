import type { LibrarySelector } from "../application/types.js";
import type { SearchOptions } from "../application/ports.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  getOptions,
  hasBoolean,
  parseArgs
} from "../utils/args.js";
import { ensureNoPositionals, parseIntOption, renderJson, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface ItemsInput {
  library: LibrarySelector;
  collection?: string;
  limit?: number;
  sort?: string;
  direction?: "asc" | "desc";
  top: boolean;
  tags: string[];
  itemType?: string;
}

export class ItemsCommand implements CommandModule<ItemsInput> {
  readonly name = "items";
  readonly category = "Core";
  readonly description = "List items.";

  help(): string {
    return [
      "Usage: zt items [options]",
      "",
      "List items, optionally within a collection.",
      "",
      "Options:",
      "  --group <id>           Library group ID",
      "  --collection <key>     Collection key to list items from",
      "  --limit <n>            Maximum number of results",
      "  --sort <field>         Sort field (e.g. title, dateModified, dateAdded)",
      "  --direction <asc|desc> Sort direction",
      "  --top                  Only show top-level items (no attachments/notes)",
      "  --tag <tag>            Filter by tag (repeatable)",
      "  --type <itemType>      Filter by item type (e.g. book, journalArticle)",
      "",
      "Examples:",
      "  zt items --top --limit 25",
      "  zt items --collection ABC12345 --sort dateAdded --direction desc",
      "  zt items --tag \"machine learning\" --type journalArticle"
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): ItemsInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["group", "collection", "limit", "sort", "direction", "top", "tag", "type"]);
    assertNoMissingOptionValues(parsed, ["group", "collection", "limit", "sort", "direction", "tag", "type"]);
    ensureNoPositionals(parsed, "items");

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const collection = getOption(parsed, "collection");
    const limit = parseIntOption(parsed, "limit");
    const sort = getOption(parsed, "sort");
    const direction = getOption(parsed, "direction") as "asc" | "desc" | undefined;
    const top = hasBoolean(parsed, "top");
    const tags = getOptions(parsed, "tag");
    const itemType = getOption(parsed, "type");

    return { library, collection, limit, sort, direction, top, tags, itemType };
  }

  async execute(input: ItemsInput, context: CommandContext): Promise<void> {
    const options: SearchOptions = {};
    if (input.limit !== undefined) options.limit = input.limit;
    if (input.sort) options.sort = input.sort;
    if (input.direction) options.direction = input.direction;
    if (input.tags.length > 0) options.tag = input.tags;
    if (input.itemType) options.itemType = input.itemType;

    const fetch = input.top
      ? context.zotero.listTopItems
      : context.zotero.listItems;

    const result = await fetch.call(
      context.zotero,
      input.library,
      input.collection,
      Object.keys(options).length > 0 ? options : undefined
    );
    context.output.write(renderJson(result));
  }
}
