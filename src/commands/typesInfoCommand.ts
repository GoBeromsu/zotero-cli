import { ValidationError } from "../application/errors.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  hasBoolean,
  parseArgs
} from "../utils/args.js";
import { renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface TypesInfoInput {
  itemType?: string;
  creators: boolean;
}

export class TypesInfoCommand implements CommandModule<TypesInfoInput> {
  readonly name = "types";
  readonly category = "Lookup";
  readonly description = "Show available item types, or fields for a specific type.";

  help(): string {
    return [
      "Usage:",
      "  zt types",
      "  zt types <itemType>",
      "  zt types <itemType> --creators",
      "",
      "List all available item types, or show the fields (or creator types)",
      "for a specific item type.",
      "",
      "Options:",
      "  --creators             Show creator types instead of fields",
      "",
      "Examples:",
      "  zt types",
      "  zt types journalArticle",
      "  zt types journalArticle --creators"
    ].join("\n");
  }

  parse(argv: string[]): TypesInfoInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["creators"]);
    assertNoMissingOptionValues(parsed, []);

    if (parsed.positionals.length > 1) {
      throw new ValidationError("types accepts at most one positional argument (item type).");
    }

    const itemType = parsed.positionals[0];
    const creators = hasBoolean(parsed, "creators");

    if (creators && !itemType) {
      throw new ValidationError("--creators requires an item type. Usage: zt types <itemType> --creators");
    }

    return { itemType, creators };
  }

  async execute(input: TypesInfoInput, context: CommandContext): Promise<void> {
    if (!input.itemType) {
      const result = await context.zotero.getItemTypes();
      context.output.write(renderJson(result));
    } else if (input.creators) {
      const result = await context.zotero.getItemTypeCreatorTypes(input.itemType);
      context.output.write(renderJson(result));
    } else {
      const result = await context.zotero.getItemTypeFields(input.itemType);
      context.output.write(renderJson(result));
    }
  }
}
