# Zotero CLI

Control Zotero from the command line. `zotero-cli` wraps the Zotero Web API v3 and Local API through shell-friendly verbs, JSON output, and a consistent option grammar.

```bash
# Search your library
zt search "machine learning" --limit 5

# Import a paper by DOI
zt import --doi "10.1145/3025453.3025912"

# Export as BibTeX
zt export --format bibtex --collection ABCD1234
```

## Requirements

- Node.js 20+
- Zotero 7+ (for local API reads) or a Zotero API key (for writes)
- [Zotero Translation Server](https://github.com/zotero/translation-server) (optional, for `zt import`)

## Install

```bash
npm install -g @beomsukoh/zotero-cli
```

Verify the installation:

```bash
zt items --limit 1
```

This prints a JSON array of items from your local Zotero library. If Zotero desktop is not running, the command exits with an error.

## Quickstart

List items in your library:

```bash
zt items --limit 10 --sort dateAdded
```

Search across your library:

```bash
zt search "attention is all you need"
```

Get a specific item by key:

```bash
zt get ABCD1234
```

List collections:

```bash
zt collections
```

Import a paper by DOI (requires Translation Server):

```bash
docker run -d -p 1969:1969 zotero/translation-server
zt import --doi "10.1145/3025453.3025912"
```

Attach a PDF to an existing item:

```bash
zt attach ./paper.pdf --key ABCD1234
```

Export your library as BibTeX:

```bash
zt export --format bibtex
```

## Dual-Mode Architecture

Zotero CLI supports two modes of operation:

| Mode | Base URL | Auth | Capabilities |
|---|---|---|---|
| **Local** (default) | `http://localhost:23119/api` | None | Read-only; Zotero desktop must be running |
| **Web** | `https://api.zotero.org` | API key | Full CRUD; works remotely |

**Local mode** requires no configuration — just have Zotero desktop running.

**Web mode** requires an API key from [zotero.org/settings/keys](https://www.zotero.org/settings/keys/):

```bash
export ZOTERO_API_KEY=your_key_here
export ZOTERO_USER_ID=12345
export ZOTERO_BASE_URL=https://api.zotero.org
```

### Configuration

| Variable | Default | Description |
|---|---|---|
| `ZOTERO_BASE_URL` | `http://localhost:23119/api` | API base URL |
| `ZOTERO_API_KEY` | — | API key (required for writes) |
| `ZOTERO_USER_ID` | `0` | User ID (`0` = local) |
| `ZOTERO_TRANSLATION_SERVER` | `http://localhost:1969` | Translation Server URL |

## Commands

### Core

| Command | Description |
|---|---|
| `zt items` | List items (`--collection`, `--top`, `--tag`, `--type`, `--limit`, `--sort`) |
| `zt collections` | List collections (`--parent` for subcollections) |
| `zt get <key>` | Get item by key (`--children` for attachments/notes) |
| `zt search <query>` | Search items (`--qmode`, `--tag`, `--type`) |
| `zt tags` | List tags |
| `zt libraries` | List group libraries |
| `zt delete --key <key>` | Delete item or collection (`--collection` flag) |
| `zt attach <file> --key <key>` | Upload and attach file to item |
| `zt export --format <fmt>` | Export items in citation formats |
| `zt fulltext <key>` | Get full-text content of an item |
| `zt import` | Import from DOI, ISBN, arXiv, URL, BibTeX, or PDF |

### Create

| Command | Description |
|---|---|
| `zt create:item` | Create item from JSON or `--type`/`--title`/`--doi` options |
| `zt create:collection <name>` | Create collection (`--parent` for nesting) |

### Lookup

| Command | Description |
|---|---|
| `zt types [itemType]` | List item types, or fields/creators for a type |
| `zt template <itemType>` | Get JSON template for item creation |

Run `zt --help` or `zt <command> --help` for full usage.

## Examples

### Import a paper by DOI and attach its PDF

```bash
# Start translation server (one-time)
docker run -d -p 1969:1969 zotero/translation-server

# Import: resolves metadata via Translation Server, creates item, attaches PDF
zt import ./paper.pdf --doi "10.1145/3025453.3025912" --collection COLL1234
```

### Import from arXiv

```bash
zt import --arxiv "2301.01234"
```

### Import from a BibTeX file

```bash
zt import --bibtex ./references.bib
```

### Create a journal article manually

```bash
# Get the template first
zt template journalArticle

# Create with specific fields
zt create:item --type journalArticle \
  --title "My Research Paper" \
  --doi "10.1234/example" \
  --date "2026" \
  --collection COLL1234
```

### Create from raw JSON

```bash
zt create:item '{"itemType":"book","title":"Clean Code","creators":[{"creatorType":"author","firstName":"Robert","lastName":"Martin"}]}'
```

### Browse item type schema

```bash
# List all 42 item types
zt types

# Show fields for journal articles
zt types journalArticle

# Show creator types for books
zt types book --creators
```

### Export a collection as CSL-JSON

```bash
zt export --format csljson --collection ABCD1234
```

### Export Formats

`bibtex`, `biblatex`, `ris`, `csljson`, `csv`, `tei`, `wikipedia`, `mods`, `refer`

### Work with group libraries

```bash
# List groups
zt libraries

# List items in a group
zt items --group 12345

# Search within a group
zt search "deep learning" --group 12345
```

## Philosophy

`zotero-cli` exposes what the Zotero API provides. It does not add citation management workflows, sync logic, bibliography generation pipelines, or PDF management beyond attachment upload. If the Zotero API does not offer a behavior natively, this package does not invent one.

The `import` command integrates with the official [Zotero Translation Server](https://github.com/zotero/translation-server) for DOI/ISBN/URL resolution — the same engine that powers the Zotero Connector browser extension.

## Development

```bash
pnpm install
pnpm check          # TypeScript + doc validation
pnpm test           # Unit tests
pnpm build
pnpm pack:check     # Package integrity
```

## Publishing

```bash
pnpm release:check
npm publish --access public
```

## License

MIT
