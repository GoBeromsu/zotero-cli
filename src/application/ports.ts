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

export type ExportFormat = "bibtex" | "biblatex" | "ris" | "csljson" | "csv" | "tei" | "wikipedia" | "mods" | "refer";

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

  // Schema/template methods (global, not library-scoped)
  getItemTypes(): Promise<JsonValue>;
  getItemTemplate(itemType: string): Promise<JsonValue>;
  getItemTypeFields(itemType: string): Promise<JsonValue>;
  getItemTypeCreatorTypes(itemType: string): Promise<JsonValue>;

  // Full-text
  getFullText(library: LibrarySelector, itemKey: string): Promise<JsonValue>;

  // Export
  exportItems(library: LibrarySelector, format: string, options?: SearchOptions): Promise<string>;

  // File operations
  uploadAttachment(library: LibrarySelector, parentItemKey: string, filePath: string, contentType: string): Promise<JsonValue>;
  downloadAttachment(library: LibrarySelector, itemKey: string): Promise<Buffer>;
  getFileUrl(library: LibrarySelector, itemKey: string): Promise<string>;

  // Reparent
  reparentItem(library: LibrarySelector, itemKey: string, newParentKey: string): Promise<JsonValue>;

  // Better BibTeX methods
  bbtCiteKeys(itemKeys: string[]): Promise<JsonValue>;
  bbtExport(itemKeys: string[], translator: string): Promise<string>;
  bbtSearch(query: string): Promise<JsonValue>;
  bbtProbe(): Promise<boolean>;

  // Translation Server methods
  resolveIdentifier(identifier: string): Promise<JsonValue>;
  scrapeUrl(url: string): Promise<JsonValue>;
  importBibliography(text: string): Promise<JsonValue>;
}

export interface OutputPort {
  write(message: string): void;
  writeError(message: string): void;
}
