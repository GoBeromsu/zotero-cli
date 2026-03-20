# zotero-cli

Pure CLI wrapper for the Zotero API. Supports both the local desktop API (read-only, no auth) and the web API (full CRUD with API key).

Same architecture as [devonthink-cli](https://github.com/GoBeromsu/devonthink-cli): CommandModule pattern, port/adapter, typed error hierarchy. Zero runtime dependencies.

## Install

```bash
npm install -g @goberomsu/zotero-cli
```

## Quick Start

```bash
# List items (local Zotero API, no auth needed)
zt items --limit 10

# Search
zt search "machine learning"

# Get a specific item
zt get ABCD1234

# List collections
zt collections

# Export as BibTeX
zt export --format bibtex

# Get item template for creating a journal article
zt template journalArticle

# Create an item
zt create:item --type journalArticle --title "My Paper" --doi "10.1234/example"

# Attach a PDF to an item
zt attach ./paper.pdf --key ABCD1234

# Get full-text content
zt fulltext ABCD1234

# Show available item types
zt types

# Show fields for a specific type
zt types journalArticle
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `ZOTERO_BASE_URL` | `http://localhost:23119/api` | API base URL |
| `ZOTERO_API_KEY` | — | API key (required for writes) |
| `ZOTERO_USER_ID` | `0` | User ID (`0` = local API) |

**Local mode** (reads only, Zotero desktop must be running):
```bash
zt items --limit 10
```

**Web mode** (full CRUD):
```bash
export ZOTERO_API_KEY=your_key_here
export ZOTERO_USER_ID=12345
export ZOTERO_BASE_URL=https://api.zotero.org
```

## Commands

### Core

| Command | Description |
|---|---|
| `zt items` | List items (`--collection`, `--top`, `--tag`, `--type`, `--limit`, `--sort`) |
| `zt collections` | List collections (`--parent`) |
| `zt get <key>` | Get item by key (`--children` for child items) |
| `zt search <query>` | Search items (`--qmode`, `--tag`, `--type`) |
| `zt tags` | List tags |
| `zt libraries` | List group libraries |
| `zt delete --key <key>` | Delete item or collection (`--collection` flag) |
| `zt attach <file> --key <key>` | Attach file to item (`--content-type`) |
| `zt export --format <fmt>` | Export items (bibtex, ris, csljson, csv, tei, etc.) |
| `zt fulltext <key>` | Get full-text content |

### Create

| Command | Description |
|---|---|
| `zt create:item` | Create item from JSON or `--type`/`--title`/`--doi` options |
| `zt create:collection <name>` | Create collection (`--parent` for nesting) |

### Lookup

| Command | Description |
|---|---|
| `zt types [itemType]` | List item types, or fields for a specific type |
| `zt template <itemType>` | Get JSON template for creating items |

### Export Formats

`bibtex`, `biblatex`, `ris`, `csljson`, `csv`, `tei`, `wikipedia`, `mods`, `refer`

## Architecture

```
zt <command> [options]
  -> CommandRegistry -> CommandModule.parse() -> CommandModule.execute()
    -> ZoteroPort (application boundary)
      -> HttpZoteroAdapter
        -> Zotero Local API (localhost:23119) or Web API (api.zotero.org)
```

## License

MIT
