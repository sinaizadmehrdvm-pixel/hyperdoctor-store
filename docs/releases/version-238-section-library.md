# Version 238 — Reusable Section / Block Library

Adds a persistent Lovable-style block library on top of the visual page builder.

## Shipped
- New `BuilderSectionLibrary` table with RLS enabled.
- `SUPER_ADMIN` / `EDITOR` RPCs for list/search, save/update, delete and draft-only insertion.
- Section JSON is validated server-side for supported type, shape, ID and size before persistence.
- Applying a block always generates a fresh section ID and appends to the target draft; it never publishes.
- `/admin/editor/[id]/sections` lets editors save any currently persisted draft section and insert reusable blocks.
- A floating editor productivity dock exposes Blocks, Quality, Secure Preview and Page Templates directly from the editor workspace.

Production migration creates zero presets automatically and does not alter any page content.
