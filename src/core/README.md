# core

The shared domain every module logs into: `Entry`, `Item`, `Place`, `Media`.

- `types/` — domain types generated from the database schema.
- `data/` — the repository layer. This is the **only** code that talks to the
  backend client, plus the TanStack Query hooks that wrap it.
- `registry/` — the `ModuleManifest` type and the registry itself.

`core` knows nothing about any specific module. It may not import from
`modules/` or `shell/`.
