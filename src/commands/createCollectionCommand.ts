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

interface CreateCollectionInput {
  library: LibrarySelector;
  name: string;
  parentKey?: string;
}

export class CreateCollectionCommand implements CommandModule<CreateCollectionInput> {
  readonly name = "create:collection";
  readonly category = "Create";
  readonly description = "Create a collection.";

  help(): string {
    return [
      "Usage: zt create:collection <name> [options]",
      "",
      "Create a new collection in the library.",
      "",
      "Options:",
      "  --group <id>           Library group ID",
      "  --parent <key>         Parent collection key (for subcollections)",
      "",
      "Examples:",
      '  zt create:collection "My Papers"',
      '  zt create:collection "Sub Collection" --parent ABC12345',
      '  zt create:collection "Shared" --group 123456'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): CreateCollectionInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["group", "parent"]);
    assertNoMissingOptionValues(parsed, ["group", "parent"]);

    const name = parsed.positionals[0];
    if (!name) {
      throw new ValidationError("create:collection requires a name. Usage: zt create:collection <name>");
    }

    if (parsed.positionals.length > 1) {
      throw new ValidationError("create:collection accepts at most one positional argument (name). Wrap multi-word names in quotes.");
    }

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const parentKey = getOption(parsed, "parent");

    return { library, name, parentKey };
  }

  async execute(input: CreateCollectionInput, context: CommandContext): Promise<void> {
    const data: Record<string, string> = { name: input.name };
    if (input.parentKey) {
      data.parentCollection = input.parentKey;
    }

    const result = await context.zotero.createCollection(input.library, data);
    context.output.write(renderJson(result));
  }
}
