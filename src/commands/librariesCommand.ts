import {
  assertNoUnknownOptions,
  parseArgs
} from "../utils/args.js";
import { ensureNoPositionals, renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface LibrariesInput {}

export class LibrariesCommand implements CommandModule<LibrariesInput> {
  readonly name = "libraries";
  readonly category = "Core";
  readonly description = "List group libraries.";

  help(): string {
    return [
      "Usage: zt libraries",
      "",
      "List the user's group libraries.",
      "",
      "Examples:",
      "  zt libraries"
    ].join("\n");
  }

  parse(argv: string[]): LibrariesInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, []);
    ensureNoPositionals(parsed, "libraries");
    return {};
  }

  async execute(_input: LibrariesInput, context: CommandContext): Promise<void> {
    const result = await context.zotero.listLibraries();
    context.output.write(renderJson(result));
  }
}
