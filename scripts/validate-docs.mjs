import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.resolve(root, "docs");
const indexPath = path.resolve(docsDir, "index.md");

try {
  await stat(indexPath);
} catch {
  console.log("validate-docs: OK (no docs/index.md)");
  process.exit(0);
}

const indexContent = await readFile(indexPath, "utf8");
const codeBlockMatch = indexContent.match(/```(?:text)?\n([\s\S]*?)```/);
if (!codeBlockMatch) {
  console.log("validate-docs: OK (no tree block in docs/index.md)");
  process.exit(0);
}

const treePaths = codeBlockMatch[1]
  .split("\n")
  .map(line => line.trim())
  .filter(line => line && !line.endsWith("/"));

const errors = [];
for (const treePath of treePaths) {
  const fullPath = path.resolve(docsDir, treePath);
  try {
    await stat(fullPath);
  } catch {
    errors.push(`Missing: docs/${treePath}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exit(1);
}

console.log("validate-docs: OK");
