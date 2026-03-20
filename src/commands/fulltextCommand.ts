import { ValidationError } from "../application/errors.js";
import type { LibrarySelector } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  parseArgs
} from "../utils/args.js";
import { renderJson, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface FulltextInput {
  library: LibrarySelector;
  key: string;
}

export class FulltextCommand implements CommandModule<FulltextInput> {
  readonly name = "fulltext";
  readonly category = "Core";
  readonly description = "Get full-text content of an item.";

  help(): string {
    return [
      "Usage:",
      "  zt fulltext <itemKey>",
      "  zt fulltext --key <itemKey>",
      "",
      "Retrieve the full-text content for an item.",
      "",
      "Options:",
      "  --key <key>            Item key",
      "  --group <id>           Library group ID",
      "",
      "Examples:",
      "  zt fulltext ABC12345",
      "  zt fulltext --key ABC12345",
      "  zt fulltext ABC12345 --group 123456"
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): FulltextInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["key", "group"]);
    assertNoMissingOptionValues(parsed, ["key", "group"]);

    if (parsed.positionals.length > 1) {
      throw new ValidationError("fulltext accepts at most one positional argument (item key).");
    }

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const key = parsed.positionals[0] ?? getOption(parsed, "key");

    if (!key) {
      throw new ValidationError("fulltext requires an item key. Usage: zt fulltext <itemKey> or zt fulltext --key <itemKey>");
    }

    return { library, key };
  }

  async execute(input: FulltextInput, context: CommandContext): Promise<void> {
    const result = await context.zotero.getFullText(input.library, input.key);
    context.output.write(renderJson(result));
  }
}
