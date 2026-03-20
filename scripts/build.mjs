import { chmod, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.resolve(root, "dist");

await rm(distDir, { recursive: true, force: true });
await run("pnpm", ["exec", "tsc", "-p", "tsconfig.build.json"]);
const cliPath = path.resolve(distDir, "cli.js");
const cliSource = await readFile(cliPath, "utf8");
const withShebang = cliSource.startsWith("#!")
  ? cliSource.replace(/^#!.*\n/, "#!/usr/bin/env node\n")
  : `#!/usr/bin/env node\n${cliSource}`;
await writeFile(cliPath, withShebang);
await chmod(cliPath, 0o755);

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) { resolve(); return; }
      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}
