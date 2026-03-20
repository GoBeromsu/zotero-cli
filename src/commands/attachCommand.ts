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

interface AttachInput {
  library: LibrarySelector;
  key: string;
  filePath: string;
  contentType: string;
}

export class AttachCommand implements CommandModule<AttachInput> {
  readonly name = "attach";
  readonly category = "Core";
  readonly description = "Attach a file to an existing item.";

  help(): string {
    return [
      "Usage:",
      "  zt attach <file-path> --key <parentItemKey>",
      "",
      "Upload and attach a file to an existing Zotero item.",
      "",
      "Options:",
      "  --key <parentItemKey>  Parent item key (required)",
      "  --group <id>           Library group ID",
      "  --content-type <mime>  MIME type (default: application/pdf)",
      "",
      "Examples:",
      '  zt attach paper.pdf --key ABC12345',
      '  zt attach image.png --key ABC12345 --content-type image/png',
      '  zt attach paper.pdf --key ABC12345 --group 123456'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): AttachInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["key", "group", "content-type"]);
    assertNoMissingOptionValues(parsed, ["key", "group", "content-type"]);

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const key = getOption(parsed, "key");
    const filePath = parsed.positionals[0];
    const contentType = getOption(parsed, "content-type") ?? "application/pdf";

    if (!filePath) {
      throw new ValidationError("attach requires a file path. Usage: zt attach <file-path> --key <parentItemKey>");
    }

    if (parsed.positionals.length > 1) {
      throw new ValidationError("attach accepts at most one positional argument (file path).");
    }

    if (!key) {
      throw new ValidationError("attach requires --key <parentItemKey>.");
    }

    return { library, key, filePath, contentType };
  }

  async execute(input: AttachInput, context: CommandContext): Promise<void> {
    const result = await context.zotero.uploadAttachment(
      input.library,
      input.key,
      input.filePath,
      input.contentType
    );
    context.output.write(renderJson(result));
  }
}
