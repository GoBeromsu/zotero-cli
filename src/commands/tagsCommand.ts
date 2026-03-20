import type { LibrarySelector } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  parseArgs
} from "../utils/args.js";
import { ensureNoPositionals, parseIntOption, renderJson, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface TagsInput {
  library: LibrarySelector;
  limit?: number;
}

export class TagsCommand implements CommandModule<TagsInput> {
  readonly name = "tags";
  readonly category = "Core";
  readonly description = "List tags.";

  help(): string {
    return [
      "Usage: zt tags [options]",
      "",
      "List tags in the library.",
      "",
      "Options:",
      "  --group <id>           Library group ID",
      "  --limit <n>            Maximum number of results",
      "",
      "Examples:",
      "  zt tags",
      "  zt tags --limit 100",
      "  zt tags --group 123456"
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): TagsInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["group", "limit"]);
    assertNoMissingOptionValues(parsed, ["group", "limit"]);
    ensureNoPositionals(parsed, "tags");

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const limit = parseIntOption(parsed, "limit");

    return { library, limit };
  }

  async execute(input: TagsInput, context: CommandContext): Promise<void> {
    const options: Record<string, unknown> = {};
    if (input.limit !== undefined) options.limit = input.limit;

    const result = await context.zotero.listTags(
      input.library,
      Object.keys(options).length > 0 ? options : undefined
    );
    context.output.write(renderJson(result));
  }
}
