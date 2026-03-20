import { describe, expect, it, beforeAll } from "vitest";

// Helper to check if Zotero is running
async function isZoteroRunning(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:23119/api/users/0/items?limit=1");
    return res.status === 200;
  } catch {
    return false;
  }
}

// Helper to run zt CLI
async function runZt(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const { spawn } = await import("node:child_process");
  return new Promise((resolve) => {
    const child = spawn("node", ["dist/cli.js", ...args], {
      cwd: "/Users/beomsu/Documents/Dev/CLI/zotero-cli",
      stdio: "pipe",
      env: { ...process.env, ZOTERO_BASE_URL: "http://localhost:23119/api" }
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

describe("zotero-cli smoke tests (local API)", () => {
  let available = false;

  beforeAll(async () => {
    available = await isZoteroRunning();
    if (!available) {
      console.warn("Zotero not running — skipping smoke tests");
    }
  });

  it("lists items", async () => {
    if (!available) return;
    const result = await runZt(["items", "--limit", "3"]);
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(3);
  });

  it("lists collections", async () => {
    if (!available) return;
    const result = await runZt(["collections"]);
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(Array.isArray(data)).toBe(true);
  });

  it("lists tags", async () => {
    if (!available) return;
    const result = await runZt(["tags", "--limit", "5"]);
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(Array.isArray(data)).toBe(true);
  });

  it("gets an item by key", async () => {
    if (!available) return;
    // First get a key
    const listResult = await runZt(["items", "--limit", "1"]);
    expect(listResult.code).toBe(0);
    const items = JSON.parse(listResult.stdout);
    if (items.length === 0) return;

    const key = items[0].key;
    const result = await runZt(["get", key]);
    expect(result.code).toBe(0);
    const item = JSON.parse(result.stdout);
    expect(item.key).toBe(key);
  });

  it("searches items", async () => {
    if (!available) return;
    const result = await runZt(["search", "test", "--limit", "5"]);
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(Array.isArray(data)).toBe(true);
  });

  it("gets help for all commands", async () => {
    if (!available) return;
    const result = await runZt(["help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("items");
    expect(result.stdout).toContain("collections");
    expect(result.stdout).toContain("search");
    expect(result.stdout).toContain("download");
    expect(result.stdout).toContain("bbt");
  });

  it("rejects unknown commands", async () => {
    const result = await runZt(["nonexistent"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("Unknown command");
  });
});

describe("Better BibTeX smoke tests", () => {
  let bbtAvailable = false;

  beforeAll(async () => {
    try {
      const res = await fetch("http://localhost:23119/better-bibtex/cayw?probe=true");
      bbtAvailable = res.status === 200;
    } catch {
      bbtAvailable = false;
    }
    if (!bbtAvailable) {
      console.warn("BBT not available — skipping BBT tests");
    }
  });

  it("checks BBT status", async () => {
    if (!bbtAvailable) return;
    const result = await runZt(["bbt", "status"]);
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.available).toBe(true);
  });

  it("searches via BBT", async () => {
    if (!bbtAvailable) return;
    const result = await runZt(["bbt", "search", "attention"]);
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(Array.isArray(data)).toBe(true);
  });
});
