import type { ZoteroPort, OutputPort } from "../application/ports.js";
import type { ZoteroConfig } from "../application/types.js";

export interface CommandContext {
  output: OutputPort;
  zotero: ZoteroPort;
  config: ZoteroConfig;
}

export interface CommandModule<TInput = unknown> {
  name: string;
  category: string;
  description: string;
  help(context?: CommandContext): string;
  parse(argv: string[], context?: CommandContext): TInput;
  execute(input: TInput, context: CommandContext): Promise<void>;
}
