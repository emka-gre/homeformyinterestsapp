# Tasks — Nook v0

Ordered by dependency. Groups 1–3 build the foundation, 4–5 the shell, 6–9 the first module's supporting core, 10 the module itself. Group 12 is the point of the whole exercise: use it daily before building anything else.

## 1. Project setup

- [ ] 1.1 Initialize an Expo + TypeScript app with Expo Router, running on iOS, Android, and web
- [x] 1.2 Configure path aliases and the folder structure: `core/`, `modules/`, `shell/`
- [x] 1.3 Add an import-boundary lint rule forbidding imports between `modules/*` siblings, and forbidding `shell/` from importing any specific module (design D2)
- [x] 1.4 Add Zod, TanStack Query, and the backend client; wire a query client with a persisted cache
- [ ] 1.5 Verify a placeholder screen renders on all three platforms before going further

## 2. Backend schema and privacy

- [x] 2.1 Create the hosted Postgres project; check migration tooling into the repo so schema is reproducible
- [x] 2.2 Migration: `profiles` table keyed to the auth user
- [x] 2.3 Migration: `places` table with owner, name, and coordinates
- [x] 2.4 Migration: `items` table with owner, module id, item type, name, and JSONB payload
- [x] 2.5 Migration: `entries` table with owner, module id, entry type, `occurred_at`, `status` (`planned | in_progress | done`, default `done`), `visibility`, rating, notes, tags, nullable `item_id`, nullable `place_id`, and JSONB payload
- [x] 2.6 Migration: `media` table with owner, storage path, and polymorphic attachment to an entry or item
- [x] 2.7 Migration: `user_modules` table storing per-account module enablement
- [x] 2.8 Migration: `entry_links` table per design D6 — created now, unused in v0
- [x] 2.9 Enable RLS on every table in the same migration that creates it; write owner-only policies
- [x] 2.10 Write the `friends`-visibility policy branch in dormant form so the feed needs no policy rewrite later
- [x] 2.11 Configure a private storage bucket for media with access tied to the owning record
- [x] 2.12 Verify privacy with a two-account test: confirm account B receives zero rows and no media for every table owned by account A

## 3. Core data layer

- [x] 3.1 Define TypeScript types for Entry, Item, Place, Media generated from the schema
- [ ] 3.2 Build the repository layer — the only code that talks to the backend client; all mutations async and failure-tolerant (design D10)
- [x] 3.3 Add TanStack Query hooks for reading entries, items, and places
- [x] 3.4 Add mutation hooks for create, edit, and delete of entries and items, with optimistic updates
- [ ] 3.5 Add a lint rule or review check that no screen imports the backend client directly

## 4. Module registry

- [x] 4.1 Define the `ModuleManifest` type: id, name, icon, color, entry types, item types, `FeedCard`, `DetailView`, `usesPlaces`, routes
- [x] 4.2 Build the registry: startup registration, lookup by module id and entry type
- [x] 4.3 Implement Zod-schema-driven payload validation on entry create and edit
- [ ] 4.4 Build a generic form renderer that produces a capture form from an entry type's Zod schema
- [ ] 4.5 Implement enablement reads and writes against `user_modules`
- [x] 4.6 Ensure card and detail renderers resolve for any registered module regardless of enablement (design D3)

## 5. App shell

- [ ] 5.1 Build the navigation shell with Timeline and Profile fixed, and module entries derived from the registry
- [ ] 5.2 Build the capture button and its module-derived options menu
- [ ] 5.3 Build routing that resolves module routes from manifests without naming any module
- [ ] 5.4 Verify with a throwaway dummy module that registering it adds nav, capture, and routes with zero shell edits
- [ ] 5.5 Delete the dummy module

## 6. Authentication and profile

- [ ] 6.1 Implement email link sign-up and sign-in
- [ ] 6.2 Implement session persistence across restarts, and restore-or-redirect on launch
- [ ] 6.3 Implement sign-out, clearing cached entries and media from the device
- [ ] 6.4 Auto-create a profile with a default display name on first sign-in
- [ ] 6.5 Build the profile screen with display name editing
- [ ] 6.6 Build the module toggle list on the profile screen
- [ ] 6.7 Verify enablement follows the account across two devices

## 7. Media

- [ ] 7.1 Implement photo capture and library selection on native; file picker on web, behind one interface
- [ ] 7.2 Implement upload to the private bucket with a pending/uploading/failed state per photo
- [ ] 7.3 Allow saving an entry while uploads are in flight; complete them in the background
- [ ] 7.4 Implement retry on upload failure
- [ ] 7.5 Generate or request reduced-size images for cards and lists; full resolution only in the photo viewer
- [ ] 7.6 Implement photo removal and cleanup of media orphaned by entry deletion
- [ ] 7.7 Handle denied camera and library permissions without blocking entry creation

## 8. Places and map

- [ ] 8.1 Choose the map and geocoding provider (design Open Questions)
- [ ] 8.2 Build a map component with one interface and platform-specific native and web implementations
- [ ] 8.3 Implement place search over the user's existing places, with create-new fallback
- [ ] 8.4 Implement current-location prefill, with map-point and search fallbacks when permission is denied
- [ ] 8.5 Build the place picker used by the capture flow, shown only for modules declaring `usesPlaces`
- [ ] 8.6 Build the map view listing all places as pins, with entries shown on pin selection
- [ ] 8.7 Implement place rename, propagating to all referencing entries

## 9. Entry core UI

- [ ] 9.1 Build the shared entry detail view: photos, notes, rating, tags, place, item, visibility, occurrence time
- [ ] 9.2 Build shared notes, rating, and tag inputs used by every module's capture form
- [ ] 9.3 Implement occurrence-time editing and backdating
- [ ] 9.4 Implement entry edit and delete with confirmation
- [ ] 9.5 Implement the visibility control, defaulting to private
- [ ] 9.6 Implement item deletion with a warning and reference clearing on referencing entries

## 10. Coffee module

- [ ] 10.1 Define the Coffee manifest: bean item type, brew entry type, `usesPlaces: true`
- [ ] 10.2 Define the bean Zod schema: name required; roaster, origin, roast date, process optional
- [ ] 10.3 Define the brew Zod schema with brewing method and method-dependent parameters
- [ ] 10.4 Build the bean capture form with photo attachment
- [ ] 10.5 Build the brew capture form with method selection driving which parameters appear
- [ ] 10.6 Wire bean selection and café place selection into the brew form
- [ ] 10.7 Build the brew `FeedCard` and detail view
- [ ] 10.8 Build the bean detail view, listing brews made with that bean
- [ ] 10.9 Build the Coffee library: brews list, beans list, empty states
- [ ] 10.10 Confirm no file under `modules/coffee/` imports another module, and no shell file names Coffee

## 11. Timeline

- [ ] 11.1 Build the timeline query: own entries across all modules, ordered by occurrence time descending
- [ ] 11.2 Render each entry via its module's registered card
- [ ] 11.3 Implement incremental loading of older entries with scroll position preserved
- [ ] 11.4 Build the empty states for no entries and for no enabled modules
- [ ] 11.5 Verify entries from a disabled module still render, and open read-only

## 12. Ship and dogfood

- [ ] 12.1 Produce a device build and install it on the developer's phone
- [ ] 12.2 Verify the web build works against the same account and data
- [ ] 12.3 Log real coffee daily for two weeks without touching the code
- [ ] 12.4 Record friction, missing fields, and anything the core made awkward — this is the input to the Sports change
- [ ] 12.5 Confirm the shell contains no branch on a specific module id before starting Sports
