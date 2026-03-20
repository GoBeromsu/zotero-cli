import { ValidationError } from "../application/errors.js";
import type { CommandContext, CommandModule } from "./types.js";

const CATEGORY_ORDER = ["Core", "Property", "Create", "Lookup", "Other"];

export class CommandRegistry {
  private readonly commands = new Map<string, CommandModule>();

  register(command: CommandModule): void {
    this.commands.set(command.name, command);
  }

  help(): string {
    const lines = ["Usage: zt <command> [options]", ""];
    const byCategory = new Map<string, CommandModule[]>();
    for (const command of this.commands.values()) {
      const list = byCategory.get(command.category) ?? [];
      list.push(command);
      byCategory.set(command.category, list);
    }
    for (const category of CATEGORY_ORDER) {
      const commands = byCategory.get(category);
      if (!commands || commands.length === 0) continue;
      lines.push(`${category}:`);
      for (const command of commands.sort((a, b) => a.name.localeCompare(b.name))) {
        lines.push(`  ${command.name.padEnd(24)} ${command.description}`);
      }
      lines.push("");
    }
    return lines.join("\n").trimEnd();
  }

  async run(argv: string[], context: CommandContext): Promise<void> {
    const [commandName, ...rest] = argv;
    if (!commandName || commandName === "help" || commandName === "--help") {
      context.output.write(this.help());
      return;
    }
    const command = this.commands.get(commandName);
    if (!command) throw new ValidationError(`Unknown command: ${commandName}`);
    if (rest.includes("--help")) {
      context.output.write(command.help(context));
      return;
    }
    const input = command.parse(rest, context);
    await command.execute(input, context);
  }
}
