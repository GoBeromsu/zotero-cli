# zotero-cli

Pure CLI wrapper for the Zotero API.

## Install

```bash
npm install -g zotero-cli
```

## Quick Start

```bash
# List items (uses local Zotero API, no auth needed)
zt items --limit 10

# Search
zt search "machine learning"

# List collections
zt collections

# Get a specific item
zt get ABCD1234

# List tags
zt tags
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `ZOTERO_BASE_URL` | `http://localhost:23119/api` | API base URL |
| `ZOTERO_API_KEY` | — | API key for web API (write operations) |
| `ZOTERO_USER_ID` | `0` | User ID (`0` for local API) |

For write operations, set your API key:

```bash
export ZOTERO_API_KEY=your_key_here
export ZOTERO_USER_ID=12345
export ZOTERO_BASE_URL=https://api.zotero.org
```

## Commands

### Core
- `items` — List items
- `collections` — List collections
- `get` — Get item by key
- `search` — Search items
- `tags` — List tags
- `libraries` — List group libraries
- `delete` — Delete item or collection

### Create
- `create:collection` — Create a collection

## License

MIT
