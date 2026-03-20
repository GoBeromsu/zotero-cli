import { ValidationError } from "../application/errors.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  parseArgs
} from "../utils/args.js";
import { renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

type BbtSubcommand = "status" | "cite" | "export" | "search";

interface BbtInput {
  subcommand: BbtSubcommand;
  args: string[];
  translator: string;
}

const VALID_SUBCOMMANDS: ReadonlySet<string> = new Set(["status", "cite", "export", "search"]);

export class BbtCommand implements CommandModule<BbtInput> {
  readonly name = "bbt";
  readonly category = "Lookup";
  readonly description = "Better BibTeX operations: cite keys, export, search, status.";

  help(): string {
    return [
      "Usage:",
      "  zt bbt status",
      "  zt bbt cite <key> [<key>...]",
      "  zt bbt export <key> [<key>...] --translator better-bibtex",
      "  zt bbt search <query>",
      "",
      "Better BibTeX operations.",
      "",
      "Subcommands:",
      "  status                 Check if BBT is available",
      "  cite <key> [<key>...]  Get citation keys for items",
      "  export <key> [...]     Export items via BBT",
      "  search <query>         Search via BBT",
      "",
      "Options:",
      "  --translator <name>    Translator for export (default: better-bibtex)",
      "",
      "Examples:",
      "  zt bbt status",
      "  zt bbt cite ABC12345 DEF67890",
      "  zt bbt export ABC12345 --translator better-biblatex",
      "  zt bbt search \"attention is all you need\""
    ].join("\n");
  }

  parse(argv: string[]): BbtInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["translator"]);
    assertNoMissingOptionValues(parsed, ["translator"]);

    const subcommand = parsed.positionals[0];
    if (!subcommand) {
      throw new ValidationError("bbt requires a subcommand: status, cite, export, search");
    }

    if (!VALID_SUBCOMMANDS.has(subcommand)) {
      throw new ValidationError(
        `Unknown bbt subcommand: ${subcommand}. Valid: status, cite, export, search`
      );
    }

    const args = parsed.positionals.slice(1);
    const translator = getOption(parsed, "translator") ?? "better-bibtex";

    // Validate args per subcommand
    if (subcommand === "cite" && args.length === 0) {
      throw new ValidationError("bbt cite requires at least one item key.");
    }
    if (subcommand === "export" && args.length === 0) {
      throw new ValidationError("bbt export requires at least one item key.");
    }
    if (subcommand === "search" && args.length === 0) {
      throw new ValidationError("bbt search requires a query.");
    }

    return { subcommand: subcommand as BbtSubcommand, args, translator };
  }

  async execute(input: BbtInput, context: CommandContext): Promise<void> {
    switch (input.subcommand) {
      case "status": {
        const available = await context.zotero.bbtProbe();
        context.output.write(renderJson({ available }));
        break;
      }
      case "cite": {
        const result = await context.zotero.bbtCiteKeys(input.args);
        context.output.write(renderJson(result));
        break;
      }
      case "export": {
        const result = await context.zotero.bbtExport(input.args, input.translator);
        context.output.write(result);
        break;
      }
      case "search": {
        const query = input.args.join(" ");
        const result = await context.zotero.bbtSearch(query);
        context.output.write(renderJson(result));
        break;
      }
    }
  }
}
