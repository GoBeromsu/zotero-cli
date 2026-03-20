# Architecture

## System Map

```
CLI (src/cli.ts)
  → CommandRegistry → CommandModule.parse() → CommandModule.execute()
    → ZoteroPort (application boundary)
      → HttpZoteroAdapter (HTTP client)
        → Zotero Local API (localhost:23119) or Web API (api.zotero.org)
```

## Layers

1. **CLI entry** (`cli.ts` + `compositionRoot.ts`): wires dependencies, dispatches
2. **Commands** (`commands/`): parse argv, validate, build typed input, call port
3. **Application** (`application/`): port interfaces, types, errors
4. **Adapters** (`adapters/`): HTTP implementation of ZoteroPort
5. **Infrastructure** (`infrastructure/`): HttpClient abstraction

## Key Design Decisions

- **Dual-mode**: Local API (no auth, read-only) for quick reads; Web API (API key) for writes
- **No runtime dependencies**: Only devDependencies (TypeScript, tsx, vitest)
- **Same architecture as devonthink-cli**: CommandModule pattern, port/adapter, error hierarchy
