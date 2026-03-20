# AGENTS

Short map for humans and coding agents.

## What This Repo Is

`zotero-cli` is a pure CLI wrapper over the Zotero API (Web API v3 + Local API).

- Expose Zotero API operations as CLI commands.
- Support both local (read-only, no auth) and web (full CRUD, API key) modes.
- Do not add workflow layers that the Zotero API itself does not provide.

## Read Order

1. [README.md](README.md)
2. [ARCHITECTURE.md](ARCHITECTURE.md)
3. [docs/product-specs/cli-contract.md](docs/product-specs/cli-contract.md)

## Folder Guide

- `src/` — implementation
- `test/spec/` — executable CLI contract
- `test/smoke/` — live Zotero smoke tests
- `docs/design-docs/` — principles, constraints
- `docs/product-specs/` — user-visible behavior

## Required Verification

Before release:

```bash
pnpm check
pnpm test
pnpm build
pnpm pack:check
```
