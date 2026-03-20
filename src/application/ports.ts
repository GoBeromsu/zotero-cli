import type { JsonValue, LibrarySelector } from "./types.js";

export interface ListOptions {
  limit?: number;
  start?: number;
  sort?: string;
  direction?: "asc" | "desc";
  format?: string;
}

export interface SearchOptions extends ListOptions {
  query?: string;
  qmode?: string;
  tag?: string[];
  itemType?: string;
}

export interface ZoteroPort {
  listItems(library: LibrarySelector, collectionKey?: string, options?: SearchOptions): Promise<JsonValue>;
  listTopItems(library: LibrarySelector, collectionKey?: string, options?: SearchOptions): Promise<JsonValue>;
  getItem(library: LibrarySelector, itemKey: string): Promise<JsonValue>;
  getItemChildren(library: LibrarySelector, itemKey: string, options?: ListOptions): Promise<JsonValue>;
  listCollections(library: LibrarySelector, parentKey?: string, options?: ListOptions): Promise<JsonValue>;
  getCollection(library: LibrarySelector, collectionKey: string): Promise<JsonValue>;
  listTags(library: LibrarySelector, options?: ListOptions): Promise<JsonValue>;
  listLibraries(): Promise<JsonValue>;
  searchItems(library: LibrarySelector, query: string, options?: SearchOptions): Promise<JsonValue>;
  createItem(library: LibrarySelector, data: JsonValue): Promise<JsonValue>;
  updateItem(library: LibrarySelector, itemKey: string, data: JsonValue, version: number): Promise<JsonValue>;
  deleteItem(library: LibrarySelector, itemKey: string, version: number): Promise<JsonValue>;
  createCollection(library: LibrarySelector, data: JsonValue): Promise<JsonValue>;
  deleteCollection(library: LibrarySelector, collectionKey: string, version: number): Promise<JsonValue>;
  addToCollection(library: LibrarySelector, itemKey: string, collectionKey: string): Promise<JsonValue>;
  removeFromCollection(library: LibrarySelector, itemKey: string, collectionKey: string): Promise<JsonValue>;
}

export interface OutputPort {
  write(message: string): void;
  writeError(message: string): void;
}
