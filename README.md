# Nook

*A home for my interests.*

Tracking hobbies today means one app per hobby: one for training, one for coffee,
one for books, one for recipes. Each has its own login, its own habits, and its
own silo, and none of them can answer a question that spans two of them.

Nook is a single private log for all of them. You enable only the modules you
care about, and everything you log lands in one unified timeline. The bet behind
it: most hobby domains share the same underlying shape — a timestamped event with
a photo, a note, a rating, and optionally a place — so they can share one core
rather than being five apps glued together.

## Status

Early. The repository currently holds the Expo scaffold, the folder architecture,
and the lint rules that enforce it. The v0 change — the module shell plus the
Coffee module — is specified in `openspec/` but not yet implemented.

## Stack

- **Client** — Expo (React Native) + Expo Router, TypeScript, targeting iOS,
  Android, and web from one codebase.
- **Backend** — Supabase: Postgres with row-level security, Auth, Storage, and
  PostGIS. Privacy is enforced at the database row level rather than
  reimplemented in each module.

## Getting started

```bash
npm install
npm start          # then press i / a / w, or scan the QR code
```

Platform shortcuts:

```bash
npm run ios
npm run android
npm run web
npm run lint
```

## Architecture

Three top-level areas under [src/](src/), each with its own README:

| Directory | Role |
| --- | --- |
| [src/core/](src/core/) | The shared domain every module logs into — `Entry`, `Item`, `Place`, `Media` — plus the repository layer and the module registry. Knows nothing about any specific module. |
| [src/modules/](src/modules/) | One directory per hobby. Each exports a `ModuleManifest`: a payload schema, capture UI, and renderers. |
| [src/shell/](src/shell/) | Navigation, the capture button, routing, profile surfaces — everything that is the app rather than any one hobby. |
| [src/app/](src/app/) | Expo Router routes; the shell's entry points. |

Three rules hold the whole thing together:

1. A module never imports a sibling module. Coffee may not reach into Sports,
   ever. Shared behaviour belongs in `core/`.
2. The shell never branches on a module id. It learns what modules exist only by
   reading the registry.
3. `core/` never imports from `modules/` or `shell/`.

These are enforced by `eslint-plugin-boundaries` in [eslint.config.js](eslint.config.js),
not by convention — conventions do not survive a tired evening. Run `npm run lint`
to check them.

Path aliases (`@/core/*`, `@/modules/*`, `@/shell/*`, `@/*`, `@/assets/*`) are
defined in [tsconfig.json](tsconfig.json).

## Specs

Planning lives in [openspec/](openspec/) rather than in issue trackers. The
active change is
[nook-v0-shell-and-coffee](openspec/changes/nook-v0-shell-and-coffee/):

- [proposal.md](openspec/changes/nook-v0-shell-and-coffee/proposal.md) — why, what
  changes, and what is explicitly out of scope for v0
- [design.md](openspec/changes/nook-v0-shell-and-coffee/design.md) — the decisions
  (D1, D2, …) the code refers back to
- [tasks.md](openspec/changes/nook-v0-shell-and-coffee/tasks.md) — ordered
  implementation checklist
- [specs/](openspec/changes/nook-v0-shell-and-coffee/specs/) — capability specs:
  `user-account`, `module-registry`, `entry-logging`, `entry-privacy`,
  `media-capture`, `places`, `timeline`, `coffee-module`

## Roadmap

**v0** — module shell + Coffee. Coffee is chosen deliberately: it exercises nearly
the whole shared core (media, notes, ratings, places, maps) and is logged daily,
so the architecture gets validated by real use rather than by intent.

**Next** — Sports, which stresses the core in the opposite direction and is the
actual test of whether this architecture holds.

**Deferred** — the social feed, friends and follows; cross-module entry links; an
offline write queue; derived insights. The `visibility` field and the
`entry_links` table ship early so none of these become migrations later.
