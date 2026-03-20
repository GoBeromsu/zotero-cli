import { ValidationError } from "../application/errors.js";
import type { JsonValue, LibrarySelector } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  parseArgs
} from "../utils/args.js";
import { renderJson, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface CreateItemInput {
  library: LibrarySelector;
  jsonData?: JsonValue;
  type?: string;
  title?: string;
  date?: string;
  url?: string;
  doi?: string;
  collection?: string;
}

export class CreateItemCommand implements CommandModule<CreateItemInput> {
  readonly name = "create:item";
  readonly category = "Create";
  readonly description = "Create an item from a JSON string or key=value pairs.";

  help(): string {
    return [
      "Usage:",
      "  zt create:item '<json>'",
      '  zt create:item --type <itemType> --title "Title" [options]',
      "",
      "Create a new Zotero item from JSON or from individual options.",
      "",
      "Options:",
      "  --group <id>           Library group ID",
      "  --type <itemType>      Item type (e.g. journalArticle, book)",
      '  --title <title>        Item title',
      '  --date <date>          Date (e.g. "2026")',
      "  --url <url>            URL",
      "  --doi <doi>            DOI",
      "  --collection <key>     Collection key to add the item to",
      "",
      "Examples:",
      `  zt create:item '{"itemType":"journalArticle","title":"My Paper"}'`,
      '  zt create:item --type journalArticle --title "My Paper" --date "2026"',
      '  zt create:item --type book --title "My Book" --collection ABC12345'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): CreateItemInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["group", "type", "title", "date", "url", "doi", "collection"]);
    assertNoMissingOptionValues(parsed, ["group", "type", "title", "date", "url", "doi", "collection"]);

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const collection = getOption(parsed, "collection");

    // If positional[0] looks like JSON, parse it directly
    const positional = parsed.positionals[0];
    if (positional && positional.trimStart().startsWith("{")) {
      try {
        const jsonData = JSON.parse(positional) as JsonValue;
        return { library, jsonData, collection };
      } catch {
        throw new ValidationError("Invalid JSON provided. Ensure the JSON string is valid.");
      }
    }

    if (parsed.positionals.length > 0 && !positional?.trimStart().startsWith("{")) {
      throw new ValidationError("Unexpected positional argument. Provide JSON or use --type/--title options.");
    }

    // Build from options
    const type = getOption(parsed, "type");
    const title = getOption(parsed, "title");
    const date = getOption(parsed, "date");
    const url = getOption(parsed, "url");
    const doi = getOption(parsed, "doi");

    if (!type) {
      throw new ValidationError("create:item requires --type or a JSON string. Usage: zt create:item --type <itemType> --title \"Title\"");
    }

    return { library, type, title, date, url, doi, collection };
  }

  async execute(input: CreateItemInput, context: CommandContext): Promise<void> {
    let itemData: JsonValue;

    if (input.jsonData) {
      itemData = input.jsonData;
    } else {
      // Get the template and overlay provided fields
      const template = await context.zotero.getItemTemplate(input.type!) as Record<string, JsonValue>;
      if (input.title !== undefined) template["title"] = input.title;
      if (input.date !== undefined) template["date"] = input.date;
      if (input.url !== undefined) template["url"] = input.url;
      if (input.doi !== undefined) template["DOI"] = input.doi;
      itemData = template;
    }

    // Add to collection if specified
    if (input.collection) {
      const data = itemData as Record<string, JsonValue>;
      const existing = Array.isArray(data["collections"]) ? data["collections"] as string[] : [];
      data["collections"] = [...existing, input.collection];
      itemData = data;
    }

    // Zotero API expects an array for item creation
    const result = await context.zotero.createItem(input.library, [itemData]);
    context.output.write(renderJson(result));
  }
}
