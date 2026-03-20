import { ValidationError } from "../application/errors.js";
import type { LibrarySelector } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  parseArgs
} from "../utils/args.js";
import { ensureNoPositionals, renderJson, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface ReparentInput {
  library: LibrarySelector;
  key: string;
  parentKey: string;
}

export class ReparentCommand implements CommandModule<ReparentInput> {
  readonly name = "reparent";
  readonly category = "Core";
  readonly description = "Change the parent of an attachment or note item.";

  help(): string {
    return [
      "Usage:",
      "  zt reparent --key <attachmentKey> --parent <newParentKey>",
      "",
      "Change the parent of an attachment or note item.",
      "",
      "Options:",
      "  --key <key>            Attachment or note key (required)",
      "  --parent <key>         New parent item key (required)",
      "  --group <id>           Library group ID",
      "",
      "Examples:",
      "  zt reparent --key ATT12345 --parent ABC12345",
      "  zt reparent --key ATT12345 --parent ABC12345 --group 123456"
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): ReparentInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["key", "parent", "group"]);
    assertNoMissingOptionValues(parsed, ["key", "parent", "group"]);
    ensureNoPositionals(parsed, "reparent");

    const key = getOption(parsed, "key");
    if (!key) {
      throw new ValidationError("reparent requires --key <attachmentKey>.");
    }

    const parentKey = getOption(parsed, "parent");
    if (!parentKey) {
      throw new ValidationError("reparent requires --parent <newParentKey>.");
    }

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });

    return { library, key, parentKey };
  }

  async execute(input: ReparentInput, context: CommandContext): Promise<void> {
    const result = await context.zotero.reparentItem(
      input.library,
      input.key,
      input.parentKey
    );
    context.output.write(renderJson(result));
  }
}
