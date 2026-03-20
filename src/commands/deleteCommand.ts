import { ValidationError } from "../application/errors.js";
import type { JsonValue, LibrarySelector } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  hasBoolean,
  parseArgs
} from "../utils/args.js";
import { ensureNoPositionals, renderJson, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface DeleteInput {
  library: LibrarySelector;
  key: string;
  isCollection: boolean;
}

export class DeleteCommand implements CommandModule<DeleteInput> {
  readonly name = "delete";
  readonly category = "Core";
  readonly description = "Delete an item or collection.";

  help(): string {
    return [
      "Usage: zt delete --key <key> [options]",
      "",
      "Delete an item or collection. The current version is fetched",
      "automatically before deletion.",
      "",
      "Options:",
      "  --key <key>            Item or collection key (required)",
      "  --group <id>           Library group ID",
      "  --collection           Delete a collection instead of an item",
      "",
      "Examples:",
      '  zt delete --key ABC12345',
      '  zt delete --key ABC12345 --collection',
      '  zt delete --key ABC12345 --group 123456'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): DeleteInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["key", "group", "collection"]);
    assertNoMissingOptionValues(parsed, ["key", "group"]);
    ensureNoPositionals(parsed, "delete");

    const key = getOption(parsed, "key");
    if (!key) {
      throw new ValidationError("delete requires --key.");
    }

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const isCollection = hasBoolean(parsed, "collection");

    return { library, key, isCollection };
  }

  async execute(input: DeleteInput, context: CommandContext): Promise<void> {
    if (input.isCollection) {
      const collection = await context.zotero.getCollection(input.library, input.key) as Record<string, JsonValue>;
      const version = (collection.version as number) ?? 0;
      const result = await context.zotero.deleteCollection(input.library, input.key, version);
      context.output.write(renderJson(result));
    } else {
      const item = await context.zotero.getItem(input.library, input.key) as Record<string, JsonValue>;
      const version = (item.version as number) ?? 0;
      const result = await context.zotero.deleteItem(input.library, input.key, version);
      context.output.write(renderJson(result));
    }
  }
}
