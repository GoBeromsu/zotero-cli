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
import { DeleteCommand } from "./commands/deleteCommand.js";

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
      process.env["ZOTERO_BASE_URL"] ?? "http://localhost:23119/api"
  };

  const http = new NodeHttpClient();
  const zotero = new HttpZoteroAdapter(
    http,
    config.baseUrl,
    config.apiKey,
    config.userId
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
  registry.register(new DeleteCommand());

  return { output, zotero, registry, config };
}
