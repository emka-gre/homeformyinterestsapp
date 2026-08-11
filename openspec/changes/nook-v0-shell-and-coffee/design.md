# Design — Nook v0

## Context

Greenfield build; no existing code. See `proposal.md — Why` for motivation.

The constraints that actually shape this design:

- **Single developer, personal project, indefinite timeline.** Motivation is the scarcest resource. The design must reach "I used my own app today" quickly, and must not require building infrastructure for users who do not exist.
- **May become a real product later.** So a small set of decisions that are cheap now and expensive to retrofit (auth, `user_id`, RLS, visibility, portable schema) are made now, and everything else is deferred.
- **Five modules are planned, two are certain.** The architecture's job is to make module #3 through #5 cheap. Its correctness is unproven until module #2 exists.
- **Sports and Coffee stress the core in opposite directions.** Coffee is unstructured, photo-heavy, place-bound, online, and will live in JSONB forever. Sports is numeric, series-oriented, offline-critical, and will eventually need real columns. Anything that only satisfies one of them is wrong.

## Goals / Non-Goals

**Goals:**

- A core domain that all five planned modules map onto without special-casing.
- A module contract narrow enough that adding Books, Art, or Cooking is a weekend, not a project.
- Privacy enforced in one place, so no module can leak by omission.
- A data layer that does not assume the network is present, so the Sports offline queue is an addition rather than a rewrite.
- Forward-compatible table shapes for deferred features (feed, cross-module links) so they cost no migration.

**Non-Goals (design-level, beyond the proposal's scope cuts):**

- Dynamic or third-party module loading. Modules are compiled in.
- Multi-tenancy, admin tooling, moderation, or analytics infrastructure.
- A generic plugin API with versioning or compatibility guarantees.
- Optimizing for scale. Correct at single-user scale is the bar.

## Decisions

### D1. One shared domain, not five verticals

Modules do not own storage. Every module logs into the same four core tables.

```
   ┌─────────┐            ┌─────────┐            ┌─────────┐
   │  ITEM   │◀───────────│  ENTRY  │───────────▶│  PLACE  │
   │ a thing │  item_id   │ an event│  place_id  │  a spot │
   │ you own │ (nullable) │ that    │ (nullable) │ on a map│
   │ or ref  │            │ happened│            └─────────┘
   └────┬────┘            └────┬────┘
        │                      │
        │    ┌─────────┐       │
        └───▶│  MEDIA  │◀──────┘
             └─────────┘
```

The mapping that justifies it:

| Module  | Item              | Entry              | Place            |
|---------|-------------------|--------------------|------------------|
| Coffee  | bean bag          | a brew / a cup     | café             |
| Sports  | exercise, plan    | a session          | gym (rare)       |
| Books   | book              | reading, finishing | —                |
| Art     | artwork, show     | a visit            | gallery, museum  |
| Cooking | recipe            | cooked it          | —                |

What varies between modules is only: the **payload schema**, the **capture UI**, and the **derived views**. A module that wants its own auth, upload path, rating scale, or sharing rule has broken the boundary.

**Alternative considered — a table and a vertical slice per module.** Rejected: it makes module #3 as expensive as module #1, and it makes cross-module questions ("everything I rated 5 stars this year", one timeline) into union queries that grow with every module. That is the "five apps glued together" failure mode, arrived at honestly.

**Consequence worth stating explicitly:** ratings, notes, and tags live on the core `Entry`, not in module payloads, even though each module will be tempted to define its own. Cross-module querying is the entire value proposition; putting the rating in a JSONB blob throws it away.

### D2. Modules are a registry, held to plugin discipline

There are three levels of pluginness. We take the cheapest and impose the strictest's boundaries:

| Level | Mechanism | Verdict |
|---|---|---|
| 1. Registry + flag | All modules in the bundle; a module is a registered manifest object; enablement is a user setting | **Chosen** |
| 2. Code-split / lazy | Module bundles loaded on demand | Only if bundle size hurts |
| 3. True plugins | Third-party, sandboxed, versioned API | Only if modules become a product |

A module is a manifest:

```
ModuleManifest {
  id, name, icon, color
  entryTypes: [{ id, label, schema, CaptureScreen, DetailView }]
  itemTypes:  [{ id, label, schema, ... }]
  FeedCard:   (entry) => Component     // always available — see D3
  usesPlaces: boolean
  routes
}
```

The shell reads the registry to build navigation, routing, and the capture menu. **The shell must never branch on a module id.** `if (module === 'coffee')` in shell code is the defect this design exists to prevent, and it is greppable.

Modules must not import from one another. Enforced by an import-boundary lint rule, not by convention — conventions do not survive a tired evening.

**Alternative considered — a real plugin loader.** Rejected: it is significant machinery in service of plugins only this developer will ever write, and it buys nothing that folder discipline does not.

### D3. Enabled-ness gates navigation and capture, never rendering

```
  module ENABLED   →  nav entry · capture flows · library · insights
  module DISABLED  →  hidden from nav and capture,
                      but existing entries still render, and data is retained
```

Two reasons this matters more than it looks. First, turning a module off must never look like data loss. Second, when the feed arrives, a friend can share from a module you do not have enabled — if "disabled" meant "renderer absent", the feed would break on its most ordinary case. So `FeedCard` and `DetailView` are registered unconditionally; only capture and navigation consult enablement.

### D4. JSONB payload by default; a module graduates to tables when it earns it

```
  entries
  ├─ id, user_id, module_id, entry_type
  ├─ occurred_at, created_at, updated_at
  ├─ status        planned | in_progress | done   (D7)
  ├─ visibility    private | friends | public   (D5)
  ├─ rating, notes, tags                   (core — see D1)
  ├─ item_id?, place_id?
  └─ payload  JSONB   ← module-shaped
```

New modules require no migration. The cost is that aggregate queries over payload fields are awkward and there is no referential integrity inside the blob.

That cost is acceptable for Coffee, Books, Art, and Cooking — none of them need to `GROUP BY` a payload field. It is not acceptable for Sports, which will want "volume per muscle group over six months". So: **JSONB is the default contract; a module may own additional tables once its analytics justify them.** Sports is expected to be the only one, and it does so in its own change, not this one.

**Alternative considered — a typed table per module from the start.** Rejected for v0: it front-loads migration cost onto the four modules that will never need it, and it forces core to know module names.

### D5. Privacy is a database guarantee, not an application convention

`visibility` lives on the core `Entry` and defaults to `private`. Access is enforced by Postgres row-level security, so a module cannot leak data by forgetting a check.

```
  own rows        →  always readable by owner
  everything else →  denied unless visibility >= friends
                     AND author ∈ viewer's friends   (policy ships dormant in v0)
```

This is a primary reason for choosing Postgres-with-RLS: the privacy requirement is the single thing least tolerable to reimplement per module, and RLS makes "private by default" the behavior of the storage layer rather than a rule five capture screens must each remember.

In v0 no friend graph exists, so the effective policy is "owner only". The column and policy structure ship now because retrofitting a visibility column across every module later is exactly the migration this avoids.

**Forward-compat note (not built in v0):** when the feed arrives, a shared entry's card should carry a **denormalized snapshot** of the item and place names it references, rather than live-joining rows that are themselves private. Joining live would make every shared entry a potential leak of a private item.

### D6. Cross-module links: core owns the relation, modules stay ignorant

Not built in v0. The shape is fixed now so it costs no migration:

```
  entry_links
  ├─ source_type · source_id       (entry | item | place)
  ├─ target_type · target_id
  ├─ relation                       "with" | "at" | "inspired-by"
  └─ created_at
```

The linking UI is core: it searches across all of the user's entries and items and renders results using each module's `FeedCard` — which is registered unconditionally (D3), so this works without any module importing another. "This espresso, at this café, while reading this book" is the clearest expression of why this is one app instead of five, but it is a v1.5 feature, not a v0 one.

### D7. `status` is a core column: backlogs and in-flight activity are both cross-cutting

```
  entries.status ∈ { planned, in_progress, done }    default: done
```

"Planned" is not a Sports concept. A café to try, a book to read, a recipe never cooked, an exhibition before it closes, a session scheduled Thursday — every module wants a backlog, and one column gives it to all of them.

`in_progress` covers the opposite end: an entry built up over time rather than saved in one shot. Coffee is captured in thirty seconds; a training session accumulates over an hour and needs a durable "started, not finished" state that survives the app closing. Adding the value now costs one line in the initial migration and avoids an enum migration when that module lands.

No v0 UI depends on either non-default value; the column ships complete so both features are later free.

### D8. Stack: Expo + Supabase

```
  client    Expo (React Native) + Expo Router     iOS · Android · web, one codebase
  language  TypeScript throughout
  backend   Supabase — Postgres · RLS · Auth · Storage · PostGIS
  data      TanStack Query with a persisted cache
  schemas   Zod, one per entry/item type
```

- **Expo** is the only mature "one codebase, three platforms" option where web is not an afterthought, and it provides camera, filesystem, and notifications without ejecting.
- **Supabase** collapses five core concerns into one service and makes D5 native. Critically, it is *plain Postgres* — migrations are checked into this repo and the schema is portable, so "personal project that might become a product" does not become "trapped in a BaaS".
- **Zod as the module contract** is what makes D1 cheap in practice rather than only in principle: one schema per entry type yields form generation, runtime validation, and TypeScript types from a single declaration.

**Alternatives considered.** *Flutter*: better UI consistency and performance, weaker web story, and a smaller ecosystem for this backend pairing. *Next.js PWA only*: roughly half the work, but concedes native camera, offline, and notifications — all of which Sports needs. *Custom Node + Postgres backend*: more control for later ML work, materially slower to first use, and re-implements RLS by hand.

### D9. Navigation is derived, and Timeline is home

With two modules enabled, a footer of `Timeline · ☕ · 🏋 · Profile` is fine. The crowding problem only appears at four or more enabled modules, at which point modules likely become filters over the timeline rather than destinations.

That decision does not need making now. What matters is that **navigation is rendered from the registry**, so tabs-versus-lenses becomes a shell change rather than a rewrite. Timeline is the home tab regardless — it is the screen that makes the consolidation visible, and it is the one thing no single-hobby app can show.

### D10. All writes go through one path, so offline is additive

Coffee does not need an offline queue and v0 will not have one. But Sports does — a workout timer that fails without signal is useless, and gyms have no signal.

Therefore no screen calls the backend client directly. Every mutation goes through a single repository layer whose signature is already asynchronous and failure-tolerant. Adding a persisted mutation queue behind that layer is then a change in one place instead of in every capture screen. This costs nothing now and is the difference between adding offline support and rewriting for it.

## Risks / Trade-offs

- **The architecture is unproven until module #2.** → Build Sports immediately after this change, deliberately, as a test. If it takes two weeks, the design holds; if core needs reshaping, that is worth discovering at module #2 rather than module #5. This risk is not mitigated by more design.
- **JSONB makes Sports analytics painful.** → The graduation path in D4 is explicit and expected to be exercised exactly once.
- **Over-abstraction for a one-person app.** → Level-1 pluginness (D2) is deliberately the cheapest option; the discipline is a lint rule, not a framework.
- **Backend lock-in.** → Schema and migrations live in this repo; Supabase is Postgres, and the exit is a `pg_dump`, not a rewrite.
- **Maps behave differently on native and web.** → Put the map behind one component interface with platform-specific implementations; no calling screen learns which platform it is on.
- **Motivation risk, the largest one.** → Ship Coffee end-to-end and genuinely nice before starting anything else. A half-built shell with no usable module gets abandoned; a working coffee log gets used daily, and daily use is what surfaces the design's real flaws.
- **Trade-off accepted:** core owning ratings, notes, and tags (D1) means a module wanting a genuinely different rating model must either use the core one or duplicate it in its payload. Cross-module querying is judged worth that constraint.

## Migration Plan

Greenfield — no data to migrate and no rollback obligation at single-user scale.

1. SQL migrations are checked into the repo and applied in order; the hosted project is never edited by hand, so the schema is reproducible and portable.
2. RLS is enabled on every table at creation, never added afterward. A table created without RLS is the one mistake here with real consequences.
3. Dormant-by-design columns (`visibility`, `status`) and the `entry_links` table ship in the initial migration set.
4. Ship to a device via Expo's development/preview build and use it daily before adding a second module.

## Open Questions

- **Map and geocoding provider.** Affects the `places` implementation but not its specified behavior; decide when building that slice.
- **Image resize and retention policy.** Whether to store originals or capped-resolution derivatives, and what thumbnail sizes to generate. Storage-tier concern; no spec depends on the answer.
- **Whether Books and Art share taxonomy helpers.** Both are later changes, and D2 forbids them importing each other regardless; if they share, it will be via a core utility.
