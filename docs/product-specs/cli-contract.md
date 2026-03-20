# CLI Contract

## Product Statement

`zotero-cli` is a pure CLI wrapper over the Zotero API.

## Public Output

- JSON by default
- Zotero API property names
- Stable option grammar for shell usage

## Public Command Families

### Core commands
- `items` — list items
- `collections` — list collections
- `get` — get item by key
- `search` — search items
- `tags` — list tags
- `libraries` — list group libraries
- `delete` — delete item or collection

### Create commands
- `create:collection` — create a collection

## Non-Goals

- Citation formatting workflows
- PDF management
- Sync logic
- Bibliography generation
