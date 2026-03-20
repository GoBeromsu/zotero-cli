import { ValidationError } from "../application/errors.js";
import type { LibrarySelector } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  hasBoolean,
  parseArgs
} from "../utils/args.js";
import { renderJson, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface ItemGetInput {
  library: LibrarySelector;
  key: string;
  children: boolean;
}

export class ItemGetCommand implements CommandModule<ItemGetInput> {
  readonly name = "get";
  readonly category = "Core";
  readonly description = "Get an item by key.";

  help(): string {
    return [
      "Usage:",
      "  zt get <key>",
      "  zt get --key <key>",
      "",
      "Retrieve a single item by its key.",
      "",
      "Options:",
      "  --key <key>            Item key",
      "  --group <id>           Library group ID",
      "  --children             Show child items (attachments, notes)",
      "",
      "Examples:",
      '  zt get ABC12345',
      '  zt get --key ABC12345 --children',
      '  zt get --key ABC12345 --group 123456'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): ItemGetInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["key", "group", "children"]);
    assertNoMissingOptionValues(parsed, ["key", "group"]);

    if (parsed.positionals.length > 1) {
      throw new ValidationError("get accepts at most one positional argument (item key).");
    }

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const key = parsed.positionals[0] ?? getOption(parsed, "key");
    const children = hasBoolean(parsed, "children");

    if (!key) {
      throw new ValidationError("get requires an item key. Usage: zt get <key> or zt get --key <key>");
    }

    return { library, key, children };
  }

  async execute(input: ItemGetInput, context: CommandContext): Promise<void> {
    if (input.children) {
      const result = await context.zotero.getItemChildren(input.library, input.key);
      context.output.write(renderJson(result));
    } else {
      const result = await context.zotero.getItem(input.library, input.key);
      context.output.write(renderJson(result));
    }
  }
}
