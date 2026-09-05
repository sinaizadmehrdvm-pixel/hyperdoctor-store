# Version 230 — Visual Media Studio

Date: 2026-09-06

## Scope

Adds a real media workflow directly inside the visual editor instead of requiring manual image URLs.

## Implemented

- Dedicated Supabase Storage bucket: `site-media`.
- Public read URLs with server-only privileged uploads.
- Authenticated admin upload endpoint restricted to `SUPER_ADMIN` and `EDITOR`.
- JPEG, PNG and WebP validation with an 8 MB hard limit.
- Automatic unique object paths and immutable cache headers.
- Orphan cleanup if database media registration fails.
- Existing media-library browser inside the editor.
- Search across existing media metadata.
- Drag-and-drop image selection.
- Client-side crop/output before upload.
- Aspect presets: original, 1:1, 16:9, 4:3 and 4:5.
- Zoom plus horizontal/vertical crop positioning.
- Browser-side WebP output with a 2000 px maximum dimension.
- External HTTPS image URL fallback.
- Selecting an image updates the active section/card draft immediately.

The `visual_editor_site_media` migration was applied to Production Supabase and verified without adding or modifying page content.
