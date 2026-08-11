# modules

One directory per module. Each exports a `ModuleManifest` (design D2) and
nothing else: a payload schema, capture UI, and renderers.

Two rules, both enforced by lint rather than by memory:

1. **A module may never import from a sibling module.** Coffee may not reach
   into Sports, ever. Shared behaviour belongs in `core/`.
2. **A module may import from `core/`, never from `shell/`.**

A module gains its own database tables only when its analytics justify it;
until then its payload is JSONB.
