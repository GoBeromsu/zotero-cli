import type { OutputPort } from "../../application/ports.js";

export class ConsoleOutputAdapter implements OutputPort {
  write(message: string): void {
    process.stdout.write(`${message}\n`);
  }

  writeError(message: string): void {
    process.stderr.write(`${message}\n`);
  }
}
