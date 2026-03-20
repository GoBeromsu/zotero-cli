import { ValidationError } from "../application/errors.js";
import type { LibrarySelector } from "../application/types.js";
import type { SearchOptions } from "../application/ports.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  getOptions,
  parseArgs
} from "../utils/args.js";
import { parseIntOption, renderJson, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface SearchInput {
  library: LibrarySelector;
  query: string;
  limit?: number;
  sort?: string;
  direction?: "asc" | "desc";
  tags: string[];
  itemType?: string;
  qmode?: string;
}

export class SearchCommand implements CommandModule<SearchInput> {
  readonly name = "search";
  readonly category = "Core";
  readonly description = "Search for items.";

  help(): string {
    return [
      "Usage: zt search <query> [options]",
      "",
      "Search for items in the library.",
      "",
      "Options:",
      "  --group <id>           Library group ID",
      "  --limit <n>            Maximum number of results",
      "  --sort <field>         Sort field (e.g. title, dateModified)",
      "  --direction <asc|desc> Sort direction",
      "  --tag <tag>            Filter by tag (repeatable)",
      "  --type <itemType>      Filter by item type (e.g. book, journalArticle)",
      "  --qmode <mode>         Search mode: titleCreatorYear or everything",
      "",
      "Examples:",
      '  zt search "machine learning"',
      '  zt search "neural networks" --limit 10 --sort dateAdded',
      '  zt search "deep learning" --tag AI --type journalArticle',
      '  zt search "attention" --qmode everything'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): SearchInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["group", "limit", "sort", "direction", "tag", "type", "qmode"]);
    assertNoMissingOptionValues(parsed, ["group", "limit", "sort", "direction", "tag", "type", "qmode"]);

    const query = parsed.positionals[0];
    if (!query) {
      throw new ValidationError("search requires a query. Usage: zt search <query>");
    }

    if (parsed.positionals.length > 1) {
      throw new ValidationError("search accepts at most one positional argument (query). Wrap multi-word queries in quotes.");
    }

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const limit = parseIntOption(parsed, "limit");
    const sort = getOption(parsed, "sort");
    const direction = getOption(parsed, "direction") as "asc" | "desc" | undefined;
    const tags = getOptions(parsed, "tag");
    const itemType = getOption(parsed, "type");
    const qmode = getOption(parsed, "qmode");

    return { library, query, limit, sort, direction, tags, itemType, qmode };
  }

  async execute(input: SearchInput, context: CommandContext): Promise<void> {
    const options: SearchOptions = {};
    if (input.limit !== undefined) options.limit = input.limit;
    if (input.sort) options.sort = input.sort;
    if (input.direction) options.direction = input.direction;
    if (input.tags.length > 0) options.tag = input.tags;
    if (input.itemType) options.itemType = input.itemType;
    if (input.qmode) options.qmode = input.qmode;

    const result = await context.zotero.searchItems(
      input.library,
      input.query,
      Object.keys(options).length > 0 ? options : undefined
    );
    context.output.write(renderJson(result));
  }
}
