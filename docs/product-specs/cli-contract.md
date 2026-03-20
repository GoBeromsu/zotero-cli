# CLI Contract

## Product Statement

`zotero-cli` is a pure CLI wrapper over the Zotero API.

## Public Output

- JSON by default
- Zotero API property names
- Stable option grammar for shell usage

## Public Command Families

### Core commands
- `items` — list items (with collection/tag/type filtering)
- `collections` — list collections
- `get` — get item by key
- `search` — search items
- `tags` — list tags
- `libraries` — list group libraries
- `delete` — delete item or collection
- `attach` — attach file to item (multi-step upload)
- `export` — export items (bibtex, ris, csljson, etc.)
- `fulltext` — get full-text content

### Create commands
- `create:item` — create item from JSON or key=value options
- `create:collection` — create a collection

### Lookup commands
- `types` — show available item types and fields
- `template` — get JSON template for item creation

## Non-Goals

- Citation formatting workflows
- PDF management beyond attachment upload
- Sync logic
- Bibliography generation pipelines
