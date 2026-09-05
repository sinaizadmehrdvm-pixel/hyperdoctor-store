# Versions 226–228 — Visual Site Editor

Date: 2026-09-06

## Version 226 — Page Builder Foundation

- Added `PageBuilderDocument` for isolated draft/published documents.
- Added immutable `PageBuilderRevision` snapshots.
- Added admin RPCs for get/save/publish/restore.
- Added public published-document RPC.
- Existing `Page` content remains untouched and is used as the initial legacy section until the first visual draft is saved.
- RLS is enabled on builder tables with no direct public table policies; access is RPC-only.
- The additive migration was applied successfully to Production Supabase with zero builder documents/revisions created automatically.

## Version 227 — Lovable-style Visual Editor

Route: `/admin/editor/[id]`

Implemented:

- full-screen visual editing workspace;
- section library: Hero, Rich Text, Image + Text, Cards, CTA and Spacer;
- canvas selection/highlight and floating section toolbar;
- drag/drop reorder and layer list;
- move up/down, duplicate, hide/show and delete;
- FA/TR/EN/AR per-section content editing;
- desktop/tablet/mobile viewport simulation;
- section background, foreground, spacing, max-width, alignment and layout settings;
- local undo/redo history (up to 50 states);
- explicit Draft Save and Publish actions;
- published revision list and restore action.

## Version 228 — Public Rendering & CMS Integration

- Published builder documents render on dynamic CMS pages.
- Unpublished/absent builder documents continue to render the legacy page exactly through the existing content path.
- Legacy CMS fallback is now correctly localized for FA/TR/EN/AR instead of only FA/EN.
- Site Pages admin table exposes a dedicated Visual Editor action.
- Builder save/publish/restore mutations are included in the existing admin audit pipeline.
- Public site reads only the published document, never the draft.

## Safety / rollout

Publishing is opt-in per page. The migration does not rewrite or auto-publish any existing page. A page keeps its current public content until an editor explicitly saves and publishes a visual document.

Version 225's later service-role cutover is compatible because its dynamic `admin_*` privilege revocation also covers the new builder admin RPCs when that migration is applied.
