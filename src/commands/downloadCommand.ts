import { writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { ValidationError } from "../application/errors.js";
import type { JsonValue, LibrarySelector } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  parseArgs
} from "../utils/args.js";
import { renderJson, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface DownloadInput {
  library: LibrarySelector;
  key: string;
  output?: string;
}

export class DownloadCommand implements CommandModule<DownloadInput> {
  readonly name = "download";
  readonly category = "Core";
  readonly description = "Download an attachment file to disk.";

  help(): string {
    return [
      "Usage:",
      "  zt download <key>",
      "  zt download <key> --output ./paper.pdf",
      "",
      "Download an attachment file to disk.",
      "",
      "Options:",
      "  --group <id>           Library group ID",
      "  --output <path>        Output file path (default: current dir + filename from item)",
      "",
      "Examples:",
      "  zt download ABC12345",
      "  zt download ABC12345 --output ./paper.pdf",
      "  zt download ABC12345 --group 123456"
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): DownloadInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["group", "output"]);
    assertNoMissingOptionValues(parsed, ["group", "output"]);

    if (parsed.positionals.length > 1) {
      throw new ValidationError("download accepts at most one positional argument (item key).");
    }

    const key = parsed.positionals[0];
    if (!key) {
      throw new ValidationError("download requires an item key. Usage: zt download <key>");
    }

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });
    const output = getOption(parsed, "output");

    return { library, key, output };
  }

  async execute(input: DownloadInput, context: CommandContext): Promise<void> {
    // Get item metadata to determine filename if output path not specified
    const item = await context.zotero.getItem(input.library, input.key) as Record<string, JsonValue>;
    const data = item.data as Record<string, JsonValue> | undefined;
    const filename = (data?.filename as string) ?? `${input.key}`;

    const outputPath = input.output
      ? resolve(input.output)
      : resolve(process.cwd(), filename);

    const buffer = await context.zotero.downloadAttachment(input.library, input.key);
    await writeFile(outputPath, buffer);

    context.output.write(renderJson({
      success: true,
      path: outputPath,
      size: buffer.length
    }));
  }
}
