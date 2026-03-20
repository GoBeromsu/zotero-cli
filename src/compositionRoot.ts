import type { ZoteroConfig } from "./application/types.js";
import type { ZoteroPort, OutputPort } from "./application/ports.js";
import { NodeHttpClient } from "./infrastructure/httpClient.js";
import { HttpZoteroAdapter } from "./adapters/http/HttpZoteroAdapter.js";
import { ConsoleOutputAdapter } from "./adapters/output/ConsoleOutputAdapter.js";
import { CommandRegistry } from "./commands/CommandRegistry.js";
import { LibrariesCommand } from "./commands/librariesCommand.js";
import { CollectionsCommand } from "./commands/collectionsCommand.js";
import { ItemsCommand } from "./commands/itemsCommand.js";
import { ItemGetCommand } from "./commands/itemGetCommand.js";
import { SearchCommand } from "./commands/searchCommand.js";
import { TagsCommand } from "./commands/tagsCommand.js";
import { CreateCollectionCommand } from "./commands/createCollectionCommand.js";
import { CreateItemCommand } from "./commands/createItemCommand.js";
import { DeleteCommand } from "./commands/deleteCommand.js";
import { AttachCommand } from "./commands/attachCommand.js";
import { ExportCommand } from "./commands/exportCommand.js";
import { FulltextCommand } from "./commands/fulltextCommand.js";
import { TemplateCommand } from "./commands/templateCommand.js";
import { TypesInfoCommand } from "./commands/typesInfoCommand.js";
import { ImportCommand } from "./commands/importCommand.js";
import { DownloadCommand } from "./commands/downloadCommand.js";
import { ReparentCommand } from "./commands/reparentCommand.js";
import { BbtCommand } from "./commands/bbtCommand.js";

export interface Runtime {
  output: OutputPort;
  zotero: ZoteroPort;
  registry: CommandRegistry;
  config: ZoteroConfig;
}

export function createRuntime(): Runtime {
  const config: ZoteroConfig = {
    apiKey: process.env["ZOTERO_API_KEY"],
    userId: process.env["ZOTERO_USER_ID"] ?? "0",
    baseUrl:
      process.env["ZOTERO_BASE_URL"] ?? "http://localhost:23119/api",
    translationServerUrl:
      process.env["ZOTERO_TRANSLATION_SERVER"] ?? "http://localhost:1969",
  };

  const http = new NodeHttpClient();
  const zotero = new HttpZoteroAdapter(
    http,
    config.baseUrl,
    config.apiKey,
    config.userId,
    config.translationServerUrl
  );
  const output = new ConsoleOutputAdapter();

  const registry = new CommandRegistry();
  registry.register(new LibrariesCommand());
  registry.register(new CollectionsCommand());
  registry.register(new ItemsCommand());
  registry.register(new ItemGetCommand());
  registry.register(new SearchCommand());
  registry.register(new TagsCommand());
  registry.register(new CreateCollectionCommand());
  registry.register(new CreateItemCommand());
  registry.register(new DeleteCommand());
  registry.register(new AttachCommand());
  registry.register(new ExportCommand());
  registry.register(new FulltextCommand());
  registry.register(new TemplateCommand());
  registry.register(new TypesInfoCommand());
  registry.register(new ImportCommand());
  registry.register(new DownloadCommand());
  registry.register(new ReparentCommand());
  registry.register(new BbtCommand());

  return { output, zotero, registry, config };
}
