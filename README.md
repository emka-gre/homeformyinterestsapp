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

Early. The Expo scaffold, the folder architecture and its lint rules, the full
Supabase schema with row-level security, and the first pieces of the module
registry are in place. The app shell, authentication, media, places, and the
Coffee module itself are still to build — see
[tasks.md](openspec/changes/nook-v0-shell-and-coffee/tasks.md) for the exact
checklist and what's checked off.

## Stack

- **Client** — [Expo](https://expo.dev) (React Native) + [Expo Router](https://docs.expo.dev/router/introduction/),
  written in TypeScript, targeting iOS, Android, and web from one codebase.
- **Backend** — [Supabase](https://supabase.com): Postgres with row-level
  security, Auth, Storage, and PostGIS. Privacy is enforced at the database
  row level rather than reimplemented in each module. Schema changes are
  plain SQL migrations checked into [supabase/migrations/](supabase/migrations/).
- **Data & state** — [TanStack Query](https://tanstack.com/query) for
  server-state caching and mutations, persisted to device storage via
  `@tanstack/query-async-storage-persister` and
  [AsyncStorage](https://github.com/react-native-async-storage/async-storage),
  so cached entries survive a restart.
- **Validation** — [Zod](https://zod.dev) schemas define each module's entry
  and item payloads and validate them on capture and edit.
- **Testing** — [Jest](https://jestjs.io) via `jest-expo`, with
  [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
  for component tests, and a database integration suite that re-proves the
  RLS privacy guarantee against a real, ephemeral local Supabase instance on
  every push. See [Testing](#testing) below.
- **Linting** — ESLint (`eslint-config-expo`) plus
  `eslint-plugin-boundaries`, which turns the `core` / `modules` / `shell`
  import rules below into a check that fails CI ([.github/workflows/ci.yml](.github/workflows/ci.yml))
  instead of a convention people forget.

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

## Testing

Three layers, all run in [CI](.github/workflows/ci.yml) on every push and PR:

| Layer | What it checks | Run locally with |
| --- | --- | --- |
| Lint | Import boundaries (`core`/`modules`/`shell`), general code quality | `npm run lint` |
| Typecheck | The codebase compiles under `strict` TypeScript | `npm run typecheck` |
| Unit tests | Pure logic — the module registry, Zod-schema-driven payload validation | `npm test` |
| Integration tests | Row-level security actually isolates accounts — two real signed-in users, one writes, the other must be unable to read, update, or delete it by any path | `npm run test:integration` (needs `supabase start`) |

`npm run verify` runs lint, typecheck, and unit tests together — the fast
subset with no external dependencies, worth running before every commit.

The integration suite ([tests/integration/rls-privacy.mjs](tests/integration/rls-privacy.mjs))
needs a local Supabase instance (`supabase start`, which needs Docker —
CI spins its own up on the runner, so this never touches the hosted project
or requires Docker on your machine unless you want to run it locally too).
It signs up two throwaway accounts, has one create a place/item/entry, and
asserts the other gets zero rows back — via unfiltered select, direct-by-id
fetch, update, and delete — while the owner's own access keeps working. New
tables or policies should extend this file rather than only being checked by
hand once.

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
