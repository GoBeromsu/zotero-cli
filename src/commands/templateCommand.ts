import { ValidationError } from "../application/errors.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  parseArgs
} from "../utils/args.js";
import { renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface TemplateInput {
  itemType: string;
}

export class TemplateCommand implements CommandModule<TemplateInput> {
  readonly name = "template";
  readonly category = "Lookup";
  readonly description = "Get the JSON template for creating an item of a specific type.";

  help(): string {
    return [
      "Usage:",
      "  zt template <itemType>",
      "",
      "Get the JSON template for creating a new item of the given type.",
      "",
      "Examples:",
      "  zt template journalArticle",
      "  zt template book",
      "  zt template conferencePaper"
    ].join("\n");
  }

  parse(argv: string[]): TemplateInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, []);
    assertNoMissingOptionValues(parsed, []);

    const itemType = parsed.positionals[0];
    if (!itemType) {
      throw new ValidationError("template requires an item type. Usage: zt template <itemType>");
    }

    if (parsed.positionals.length > 1) {
      throw new ValidationError("template accepts at most one positional argument (item type).");
    }

    return { itemType };
  }

  async execute(input: TemplateInput, context: CommandContext): Promise<void> {
    const result = await context.zotero.getItemTemplate(input.itemType);
    context.output.write(renderJson(result));
  }
}
