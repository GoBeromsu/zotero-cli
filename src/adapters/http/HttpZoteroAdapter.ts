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

  constructor(
    http: HttpClient,
    baseUrl: string,
    apiKey?: string,
    userId?: string
  ) {
    this.http = http;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.userId = userId;
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
