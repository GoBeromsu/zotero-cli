export type JsonPrimitive = boolean | number | string | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface LibrarySelector {
  type: "user" | "group";
  id: number | string;
}

export interface CollectionSelector {
  library: LibrarySelector;
  key?: string;
}

export interface ItemSelector {
  library: LibrarySelector;
  key?: string;
}

export interface ZoteroConfig {
  apiKey?: string;
  userId?: string;
  baseUrl: string;
  translationServerUrl?: string;
}
