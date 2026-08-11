# Nook v0 — Module Shell + Coffee

## Why

Tracking personal hobbies today means one app per hobby: one for training, one for coffee, one for books, one for recipes. Each has its own login, its own habits, and its own silo, and none of them can answer a question that spans two hobbies. The cost of that fragmentation is friction, and friction is why hobby logs get abandoned.

Nook — *a home for my interests* — is a single private log for all of them, personalized by enabling only the modules you care about. The bet is that four of five hobby domains share the same underlying shape (a timestamped event with a photo, a note, a rating, and optionally a place), so they can share one core rather than being five apps glued together.

This change delivers the foundation and proves it with exactly one module. Coffee is chosen deliberately: it exercises nearly the whole shared core (media, notes, ratings, places, maps) and is logged daily, so the architecture is validated by real use rather than by intent. Sports — the module that will stress the core in the opposite direction — follows as the next change, and is the actual test of whether this architecture holds.

## What Changes

- **New app**: a cross-platform (iOS, Android, web) client and a hosted Postgres backend. Nothing exists today; this is the initial build.
- **Core domain**: a shared `Entry` / `Item` / `Place` / `Media` model that every module logs into. Modules contribute a payload schema, not their own storage.
- **Module registry**: modules self-describe via a manifest (id, icon, entry types, capture UI, card renderer). The app shell derives navigation, routing, and the capture menu from the registry — the shell never special-cases a module by name.
- **Per-user module enablement**: users turn modules on and off from their profile. Disabled modules disappear from navigation and capture but retain their data and can still render existing entries.
- **Privacy by default**: every entry is private on creation and carries a `visibility` field enforced at the database row level, not in application code.
- **Coffee module**: bean items, brew entries with tasting notes and ratings, photos, and café places pinned on a map.
- **Unified timeline**: a single reverse-chronological view of everything logged, across all enabled modules.
- **Planned and in-flight entries**: entries carry a `status` of `planned`, `in_progress`, or `done`, giving every module both a backlog (a café to try, a session scheduled) and a durable "started but not finished" state, from one field.

### Non-goals for v0

Deliberately deferred, with the reasoning recorded in `design.md`:

- **The social feed, friends, and follows.** The `visibility` field ships now so no migration is needed later, but with no users there are no friends, and a feed is an account graph plus invites, notifications, blocking, and moderation. Sharing without a feed is out of scope too.
- **Sports, Books, Art, Cooking modules.** Sports is the immediate next change.
- **Cross-module entry links.** The table shape is designed now so it is not a migration later; the feature is not built.
- **Offline write queue.** Coffee does not need it. Sports does, so the data layer must not assume the network — but the queue itself is not v0.
- **ML / derived insights.** Descriptive statistics arrive with Sports; nothing is inferred from a single module's data.
- **Training plans.** Sessions-only when Sports lands; the nullable `Entry.item_id` already accommodates plans without a migration.

## Capabilities

### New Capabilities

- `user-account`: account creation, sign-in, session persistence, and the user profile record.
- `module-registry`: the module manifest contract, per-user enablement, and shell navigation derived from enabled modules.
- `entry-logging`: the shared Entry/Item domain — create, edit, delete, notes, ratings, `status`, and module-specific payload validation.
- `entry-privacy`: private-by-default visibility and its enforcement on every read and write.
- `media-capture`: photographing or picking images, uploading them, and attaching them to entries and items.
- `places`: place records, search, map display, and pinning places to entries.
- `timeline`: the unified cross-module reverse-chronological view of a user's own entries.
- `coffee-module`: the Coffee module's bean items, brew entries, tasting notes, and café pins.

### Modified Capabilities

None — there are no existing specs.

## Impact

- **New repository content**: this is a greenfield build; there is no existing code to modify.
- **Client**: Expo (React Native) + Expo Router, TypeScript, targeting iOS, Android, and web from one codebase.
- **Backend**: Supabase — Postgres with row-level security, Auth, Storage, and PostGIS. Chosen partly because the privacy requirement maps directly onto RLS policies rather than being reimplemented per module.
- **Schema validation**: module payload schemas defined once and used for form rendering, client validation, and type generation.
- **External services**: a map tile/geocoding provider for `places`.
- **Ongoing constraint**: modules must not import one another. The registry interface is the only contact surface, and this is enforced by lint rule rather than convention.
- **Cost**: hosted backend free tier is sufficient at single-user scale.
