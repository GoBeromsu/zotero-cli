import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { ValidationError, NotFoundError } from "../application/errors.js";
import type { JsonValue, LibrarySelector } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  parseArgs,
} from "../utils/args.js";
import { renderJson, resolveLibrary } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface ImportInput {
  library: LibrarySelector;
  doi?: string;
  isbn?: string;
  arxiv?: string;
  url?: string;
  bibtexFile?: string;
  collection?: string;
  filePath?: string;
}

export class ImportCommand implements CommandModule<ImportInput> {
  readonly name = "import";
  readonly category = "Core";
  readonly description = "Import items from DOI, ISBN, arXiv ID, URL, or BibTeX.";

  help(): string {
    return [
      "Usage:",
      '  zt import --doi "10.1234/example"',
      '  zt import --isbn "978-0-123456-78-9"',
      '  zt import --arxiv "2301.01234"',
      '  zt import --url "https://arxiv.org/abs/2301.01234"',
      "  zt import --bibtex ./references.bib",
      "  zt import ./paper.pdf",
      '  zt import ./paper.pdf --doi "10.1234/example"',
      "",
      "Import bibliographic metadata via the Zotero Translation Server",
      "and create items in Zotero. Optionally attach a PDF.",
      "",
      "Options:",
      "  --doi <doi>            DOI to resolve",
      "  --isbn <isbn>          ISBN to resolve",
      "  --arxiv <id>           arXiv ID to resolve",
      "  --url <url>            URL to scrape",
      "  --bibtex <file>        BibTeX file to import",
      "  --collection <key>     Add to collection after import",
      "  --group <id>           Library group ID",
      "",
      "Positional:",
      "  <file>                 PDF file to attach after creating item",
      "",
      "Examples:",
      '  zt import --doi "10.1038/s41586-021-03819-2"',
      '  zt import --arxiv "2301.01234" --collection ABC12345',
      "  zt import ./paper.pdf --doi 10.1234/example",
      "  zt import --bibtex refs.bib --group 123456",
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): ImportInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, [
      "doi", "isbn", "arxiv", "url", "bibtex", "collection", "group",
    ]);
    assertNoMissingOptionValues(parsed, [
      "doi", "isbn", "arxiv", "url", "bibtex", "collection", "group",
    ]);

    const library = resolveLibrary(parsed, context?.config ?? { baseUrl: "" });

    const doi = getOption(parsed, "doi");
    const isbn = getOption(parsed, "isbn");
    const arxiv = getOption(parsed, "arxiv");
    const url = getOption(parsed, "url");
    const bibtexFile = getOption(parsed, "bibtex");
    const collection = getOption(parsed, "collection");
    const filePath = parsed.positionals[0];

    if (parsed.positionals.length > 1) {
      throw new ValidationError("import accepts at most one positional argument (file path).");
    }

    return { library, doi, isbn, arxiv, url, bibtexFile, collection, filePath };
  }

  async execute(input: ImportInput, context: CommandContext): Promise<void> {
    const library = input.library;
    let metadata: JsonValue;

    // Step 1: Resolve metadata
    if (input.doi) {
      metadata = await context.zotero.resolveIdentifier(input.doi);
    } else if (input.isbn) {
      metadata = await context.zotero.resolveIdentifier(input.isbn);
    } else if (input.arxiv) {
      metadata = await context.zotero.resolveIdentifier(`arXiv:${input.arxiv}`);
    } else if (input.url) {
      metadata = await context.zotero.scrapeUrl(input.url);
    } else if (input.bibtexFile) {
      const content = await readFile(input.bibtexFile, "utf8");
      metadata = await context.zotero.importBibliography(content);
    } else if (input.filePath) {
      // Try to extract DOI from filename (pattern: 10.xxxx/yyyy)
      const doiMatch = basename(input.filePath).match(/10\.\d{4,}[^\s]*/);
      if (doiMatch) {
        metadata = await context.zotero.resolveIdentifier(doiMatch[0]);
      } else {
        throw new ValidationError(
          "Cannot determine metadata source. Provide --doi, --url, --isbn, or --arxiv."
        );
      }
    } else {
      throw new ValidationError(
        "import requires --doi, --url, --isbn, --arxiv, --bibtex, or a file path."
      );
    }

    // Step 2: Create the item
    // Translation server returns array of items or single item
    const items = Array.isArray(metadata) ? metadata : [metadata];
    if (items.length === 0) {
      throw new NotFoundError("No items found for the given identifier.");
    }

    // Add to collection if specified
    if (input.collection) {
      for (const item of items) {
        if (typeof item === "object" && item !== null) {
          (item as Record<string, JsonValue>)["collections"] = [input.collection];
        }
      }
    }

    const created = await context.zotero.createItem(library, items as JsonValue);

    // Step 3: Attach PDF if file path provided
    if (input.filePath && input.filePath.endsWith(".pdf")) {
      const createdData = created as Record<string, JsonValue>;
      const successful = (createdData?.["successful"] ?? createdData?.["success"]) as
        Record<string, JsonValue> | undefined;
      if (successful) {
        const firstKey = Object.values(successful)[0] as Record<string, JsonValue> | undefined;
        const itemKey = (firstKey?.["key"] as string) ??
          ((firstKey?.["data"] as Record<string, JsonValue> | undefined)?.["key"] as string);
        if (itemKey) {
          await context.zotero.uploadAttachment(library, itemKey, input.filePath, "application/pdf");
        }
      }
    }

    context.output.write(renderJson(created as JsonValue));
  }
}
