import { ValidationError } from "../application/errors.js";
import type { LibrarySelector } from "../application/types.js";
import type { SearchOptions } from "../application/ports.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  parseArgs
} from "../utils/args.js";
import { ensureNoPositionals, parseIntOption, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface ExportInput {
  library: LibrarySelector;
  format: string;
  searchOptions: SearchOptions;
}

export class ExportCommand implements CommandModule<ExportInput> {
  readonly name = "export";
  readonly category = "Core";
  readonly description = "Export items in various formats.";

  help(): string {
    return [
      "Usage:",
      "  zt export --format <format>",
      "",
      "Export items in a given citation/data format.",
      "",
      "Options:",
      "  --format <format>      Export format (required): bibtex, biblatex, ris, csljson, csv, tei, wikipedia, mods, refer",
      "  --group <id>           Library group ID",
      "  --collection <key>     Limit to a specific collection",
      "  --limit <n>            Maximum number of items",
      "  --tag <tag>            Filter by tag",
      "  --type <itemType>      Filter by item type",
      "",
      "Examples:",
      "  zt export --format bibtex",
      "  zt export --format ris --collection ABC12345",
      "  zt export --format csljson --limit 50 --tag physics"
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): ExportInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["format", "group", "collection", "limit", "tag", "type"]);
    assertNoMissingOptionValues(parsed, ["format", "group", "collection", "limit", "tag", "type"]);
    ensureNoPositionals(parsed, "export");

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const format = getOption(parsed, "format");

    if (!format) {
      throw new ValidationError("export requires --format. Usage: zt export --format <format>");
    }

    const limit = parseIntOption(parsed, "limit");
    const tag = getOption(parsed, "tag");
    const itemType = getOption(parsed, "type");
    const collection = getOption(parsed, "collection");

    const searchOptions: SearchOptions = {};
    if (limit !== undefined) searchOptions.limit = limit;
    if (tag) searchOptions.tag = [tag];
    if (itemType) searchOptions.itemType = itemType;

    return { library, format, searchOptions: { ...searchOptions, ...(collection ? { query: collection } : {}) } };
  }

  async execute(input: ExportInput, context: CommandContext): Promise<void> {
    const result = await context.zotero.exportItems(input.library, input.format, input.searchOptions);
    context.output.write(result);
  }
}
