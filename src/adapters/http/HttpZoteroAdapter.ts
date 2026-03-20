import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename } from "node:path";
import type {
  ZoteroPort,
  ListOptions,
  SearchOptions,
} from "../../application/ports.js";
import type { JsonValue, LibrarySelector } from "../../application/types.js";
import {
  NotFoundError,
  ConflictError,
  ExternalToolError,
} from "../../application/errors.js";
import type { HttpClient, HttpResponse } from "../../infrastructure/httpClient.js";

export class HttpZoteroAdapter implements ZoteroPort {
  private readonly http: HttpClient;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly userId?: string;
  private readonly translationServerUrl: string;

  constructor(
    http: HttpClient,
    baseUrl: string,
    apiKey?: string,
    userId?: string,
    translationServerUrl?: string
  ) {
    this.http = http;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.userId = userId;
    this.translationServerUrl = translationServerUrl ?? "http://localhost:1969";
  }

  // ── Query methods ──────────────────────────────────────────────

  async listItems(
    library: LibrarySelector,
    collectionKey?: string,
    options?: SearchOptions
  ): Promise<JsonValue> {
    const path = collectionKey
      ? `${this.libraryPrefix(library)}/collections/${collectionKey}/items`
      : `${this.libraryPrefix(library)}/items`;
    const url = this.buildUrl(path, this.searchParams(options));
    return this.get(url);
  }

  async listTopItems(
    library: LibrarySelector,
    collectionKey?: string,
    options?: SearchOptions
  ): Promise<JsonValue> {
    const path = collectionKey
      ? `${this.libraryPrefix(library)}/collections/${collectionKey}/items/top`
      : `${this.libraryPrefix(library)}/items/top`;
    const url = this.buildUrl(path, this.searchParams(options));
    return this.get(url);
  }

  async getItem(
    library: LibrarySelector,
    itemKey: string
  ): Promise<JsonValue> {
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/items/${itemKey}`
    );
    return this.get(url);
  }

  async getItemChildren(
    library: LibrarySelector,
    itemKey: string,
    options?: ListOptions
  ): Promise<JsonValue> {
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/items/${itemKey}/children`,
      this.listParams(options)
    );
    return this.get(url);
  }

  async listCollections(
    library: LibrarySelector,
    parentKey?: string,
    options?: ListOptions
  ): Promise<JsonValue> {
    const path = parentKey
      ? `${this.libraryPrefix(library)}/collections/${parentKey}/collections`
      : `${this.libraryPrefix(library)}/collections`;
    const url = this.buildUrl(path, this.listParams(options));
    return this.get(url);
  }

  async getCollection(
    library: LibrarySelector,
    collectionKey: string
  ): Promise<JsonValue> {
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/collections/${collectionKey}`
    );
    return this.get(url);
  }

  async listTags(
    library: LibrarySelector,
    options?: ListOptions
  ): Promise<JsonValue> {
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/tags`,
      this.listParams(options)
    );
    return this.get(url);
  }

  async listLibraries(): Promise<JsonValue> {
    const id = this.userId ?? "0";
    const url = this.buildUrl(`/users/${id}/groups`);
    return this.get(url);
  }

  async searchItems(
    library: LibrarySelector,
    query: string,
    options?: SearchOptions
  ): Promise<JsonValue> {
    const params = this.searchParams(options);
    params.set("q", query);
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/items`,
      params
    );
    return this.get(url);
  }

  // ── Mutation methods ───────────────────────────────────────────

  async createItem(
    library: LibrarySelector,
    data: JsonValue
  ): Promise<JsonValue> {
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/items`
    );
    return this.post(url, data);
  }

  async updateItem(
    library: LibrarySelector,
    itemKey: string,
    data: JsonValue,
    version: number
  ): Promise<JsonValue> {
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/items/${itemKey}`
    );
    return this.patch(url, data, version);
  }

  async deleteItem(
    library: LibrarySelector,
    itemKey: string,
    version: number
  ): Promise<JsonValue> {
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/items/${itemKey}`
    );
    const response = await this.http.request("DELETE", url, {
      headers: this.headers({ "If-Unmodified-Since-Version": String(version) }),
    });
    return this.parseResponse(response);
  }

  async createCollection(
    library: LibrarySelector,
    data: JsonValue
  ): Promise<JsonValue> {
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/collections`
    );
    return this.post(url, data);
  }

  async deleteCollection(
    library: LibrarySelector,
    collectionKey: string,
    version: number
  ): Promise<JsonValue> {
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/collections/${collectionKey}`
    );
    const response = await this.http.request("DELETE", url, {
      headers: this.headers({ "If-Unmodified-Since-Version": String(version) }),
    });
    return this.parseResponse(response);
  }

  async addToCollection(
    library: LibrarySelector,
    itemKey: string,
    collectionKey: string
  ): Promise<JsonValue> {
    const item = (await this.getItem(library, itemKey)) as Record<string, JsonValue>;
    const data = item["data"] as Record<string, JsonValue> | undefined;
    const version = (item["version"] as number | undefined) ?? 0;
    const collections = Array.isArray(data?.["collections"])
      ? [...(data["collections"] as string[])]
      : [];

    if (!collections.includes(collectionKey)) {
      collections.push(collectionKey);
    }

    return this.updateItem(
      library,
      itemKey,
      { collections } as unknown as JsonValue,
      version
    );
  }

  async removeFromCollection(
    library: LibrarySelector,
    itemKey: string,
    collectionKey: string
  ): Promise<JsonValue> {
    const item = (await this.getItem(library, itemKey)) as Record<string, JsonValue>;
    const data = item["data"] as Record<string, JsonValue> | undefined;
    const version = (item["version"] as number | undefined) ?? 0;
    const collections = Array.isArray(data?.["collections"])
      ? (data["collections"] as string[]).filter((k) => k !== collectionKey)
      : [];

    return this.updateItem(
      library,
      itemKey,
      { collections } as unknown as JsonValue,
      version
    );
  }

  // ── Schema/template methods (global, not library-scoped) ─────

  async getItemTypes(): Promise<JsonValue> {
    const url = "https://api.zotero.org/itemTypes";
    return this.get(url);
  }

  async getItemTemplate(itemType: string): Promise<JsonValue> {
    const url = `https://api.zotero.org/items/new?itemType=${encodeURIComponent(itemType)}`;
    return this.get(url);
  }

  async getItemTypeFields(itemType: string): Promise<JsonValue> {
    const url = `https://api.zotero.org/itemTypeFields?itemType=${encodeURIComponent(itemType)}`;
    return this.get(url);
  }

  async getItemTypeCreatorTypes(itemType: string): Promise<JsonValue> {
    const url = `https://api.zotero.org/itemTypeCreatorTypes?itemType=${encodeURIComponent(itemType)}`;
    return this.get(url);
  }

  // ── Full-text ───────────────────────────────────────────────────

  async getFullText(
    library: LibrarySelector,
    itemKey: string
  ): Promise<JsonValue> {
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/items/${itemKey}/fulltext`
    );
    return this.get(url);
  }

  // ── Export ──────────────────────────────────────────────────────

  async exportItems(
    library: LibrarySelector,
    format: string,
    options?: SearchOptions
  ): Promise<string> {
    const params = this.searchParams(options);
    params.set("format", format);
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/items`,
      params
    );
    const response = await this.http.request("GET", url, {
      headers: this.headers(),
    });
    if (response.status >= 400) {
      throw new ExternalToolError(
        `Zotero API error (${response.status}): ${response.body || "unknown error"}`
      );
    }
    return response.body;
  }

  // ── File operations ────────────────────────────────────────────

  async uploadAttachment(
    library: LibrarySelector,
    parentItemKey: string,
    filePath: string,
    contentType: string
  ): Promise<JsonValue> {
    // 1. Get the attachment template
    const template = (await this.getItemTemplate("attachment&linkMode=imported_file")) as Record<string, JsonValue>;

    // 2. Create the attachment item
    const fileName = basename(filePath);
    const attachmentData = {
      ...template,
      parentItem: parentItemKey,
      title: fileName,
      contentType,
    };
    const createUrl = this.buildUrl(
      `${this.libraryPrefix(library)}/items`
    );
    const createResponse = await this.http.request("POST", createUrl, {
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify([attachmentData]),
    });
    const createResult = await this.parseResponse(createResponse);
    const successful = (createResult as Record<string, JsonValue>)?.["successful"] as Record<string, JsonValue> | undefined;
    const created = successful?.["0"] as Record<string, JsonValue> | undefined;
    const attachmentKey = (created?.["key"] as string) ??
      ((created?.["data"] as Record<string, JsonValue> | undefined)?.["key"] as string);

    if (!attachmentKey) {
      throw new ExternalToolError(
        `Failed to create attachment item: ${JSON.stringify(createResult)}`
      );
    }

    // 3. Read the file, compute md5 and size
    const fileBuffer = await readFile(filePath);
    const md5 = createHash("md5").update(fileBuffer).digest("hex");
    const fileSize = fileBuffer.length;
    const mtime = Date.now();

    // 4. Get upload authorization
    const authUrl = this.buildUrl(
      `${this.libraryPrefix(library)}/items/${attachmentKey}/file`
    );
    const authBody = new URLSearchParams({
      md5,
      filename: fileName,
      filesize: String(fileSize),
      mtime: String(mtime),
    }).toString();
    const authResponse = await this.http.request("POST", authUrl, {
      headers: this.headers({
        "Content-Type": "application/x-www-form-urlencoded",
        "If-None-Match": "*",
      }),
      body: authBody,
    });
    const authResult = (await this.parseResponse(authResponse)) as Record<string, JsonValue>;

    // 5. If file already exists on server, we're done
    if (authResult["exists"] === 1) {
      return { exists: true, key: attachmentKey } as unknown as JsonValue;
    }

    // 6. Upload the file to the storage service
    const uploadUrl = authResult["url"] as string;
    const prefix = authResult["prefix"] as string ?? "";
    const suffix = authResult["suffix"] as string ?? "";
    const uploadContentType = authResult["contentType"] as string;
    const uploadKey = authResult["uploadKey"] as string;

    // Build the upload body: prefix + file content + suffix
    const prefixBuf = Buffer.from(prefix, "utf-8");
    const suffixBuf = Buffer.from(suffix, "utf-8");
    const uploadBody = Buffer.concat([prefixBuf, fileBuffer, suffixBuf]);

    const uploadResponse = await this.http.request("POST", uploadUrl, {
      headers: { "Content-Type": uploadContentType },
      body: uploadBody.toString("binary"),
    });

    if (uploadResponse.status >= 400) {
      throw new ExternalToolError(
        `File upload failed (${uploadResponse.status}): ${uploadResponse.body || "unknown error"}`
      );
    }

    // 7. Register the upload
    const registerBody = new URLSearchParams({ upload: uploadKey }).toString();
    const registerResponse = await this.http.request("POST", authUrl, {
      headers: this.headers({
        "Content-Type": "application/x-www-form-urlencoded",
        "If-None-Match": "*",
      }),
      body: registerBody,
    });
    await this.parseResponse(registerResponse);

    return { success: true, key: attachmentKey } as unknown as JsonValue;
  }

  async getFileUrl(
    library: LibrarySelector,
    itemKey: string
  ): Promise<string> {
    const url = this.buildUrl(
      `${this.libraryPrefix(library)}/items/${itemKey}/file`
    );
    return url;
  }

  // ── Translation Server methods ────────────────────────────────

  async resolveIdentifier(identifier: string): Promise<JsonValue> {
    const url = `${this.translationServerUrl}/search`;
    const response = await this.http.request("POST", url, {
      headers: { "Content-Type": "text/plain" },
      body: identifier,
    });
    if (response.status === 501) {
      throw new ExternalToolError("No translator available for this identifier.");
    }
    return this.parseResponse(response);
  }

  async scrapeUrl(url: string): Promise<JsonValue> {
    const tsUrl = `${this.translationServerUrl}/web`;
    const response = await this.http.request("POST", tsUrl, {
      headers: { "Content-Type": "text/plain" },
      body: url,
    });
    if (response.status === 501) {
      throw new ExternalToolError("No translator available for this URL.");
    }
    return this.parseResponse(response);
  }

  async importBibliography(text: string): Promise<JsonValue> {
    const url = `${this.translationServerUrl}/import`;
    const response = await this.http.request("POST", url, {
      headers: { "Content-Type": "text/plain" },
      body: text,
    });
    return this.parseResponse(response);
  }

  // ── Helpers ────────────────────────────────────────────────────

  private libraryPrefix(library: LibrarySelector): string {
    return `/${library.type === "group" ? "groups" : "users"}/${library.id}`;
  }

  private buildUrl(
    path: string,
    params?: URLSearchParams
  ): string {
    const base = `${this.baseUrl}${path}`;
    if (params && Array.from(params).length > 0) {
      return `${base}?${params.toString()}`;
    }
    return base;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = {
      "Zotero-API-Version": "3",
      ...extra,
    };
    if (this.apiKey) {
      h["Zotero-API-Key"] = this.apiKey;
    }
    return h;
  }

  private async parseResponse(response: HttpResponse): Promise<JsonValue> {
    if (response.status === 204) {
      return null;
    }

    if (response.status === 404) {
      throw new NotFoundError(
        `Resource not found: ${response.body || "unknown"}`
      );
    }

    if (response.status === 409 || response.status === 412) {
      throw new ConflictError(
        `Conflict: ${response.body || "resource version mismatch"}`
      );
    }

    if (response.status >= 400) {
      throw new ExternalToolError(
        `Zotero API error (${response.status}): ${response.body || "unknown error"}`
      );
    }

    if (!response.body) {
      return null;
    }

    try {
      return JSON.parse(response.body) as JsonValue;
    } catch {
      throw new ExternalToolError(
        `Failed to parse Zotero API response: ${response.body.slice(0, 200)}`
      );
    }
  }

  private listParams(options?: ListOptions): URLSearchParams {
    const params = new URLSearchParams();
    if (!options) return params;
    if (options.limit !== undefined) params.set("limit", String(options.limit));
    if (options.start !== undefined) params.set("start", String(options.start));
    if (options.sort) params.set("sort", options.sort);
    if (options.direction) params.set("direction", options.direction);
    if (options.format) params.set("format", options.format);
    return params;
  }

  private searchParams(options?: SearchOptions): URLSearchParams {
    const params = this.listParams(options);
    if (!options) return params;
    if (options.query) params.set("q", options.query);
    if (options.qmode) params.set("qmode", options.qmode);
    if (options.tag) {
      for (const t of options.tag) {
        params.append("tag", t);
      }
    }
    if (options.itemType) params.set("itemType", options.itemType);
    return params;
  }

  // ── HTTP verb shortcuts ────────────────────────────────────────

  private async get(url: string): Promise<JsonValue> {
    const response = await this.http.request("GET", url, {
      headers: this.headers(),
    });
    return this.parseResponse(response);
  }

  private async post(url: string, data: JsonValue): Promise<JsonValue> {
    const response = await this.http.request("POST", url, {
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    return this.parseResponse(response);
  }

  private async patch(
    url: string,
    data: JsonValue,
    version: number
  ): Promise<JsonValue> {
    const response = await this.http.request("PATCH", url, {
      headers: this.headers({
        "Content-Type": "application/json",
        "If-Unmodified-Since-Version": String(version),
      }),
      body: JSON.stringify(data),
    });
    return this.parseResponse(response);
  }
}
