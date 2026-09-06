# Version 240 — Pre-Publish Quality & Safety Gate

Adds a deterministic quality gate that runs before every Visual Builder publish.

## Blocking checks
- Builder document/section structural validity.
- Maximum section count.
- Missing and duplicate section IDs.
- Unsupported section types.
- Invalid content/settings shapes.
- Executable `javascript:`, `data:` and `vbscript:` link/image schemes.

## Non-blocking warnings
- A section hidden on desktop, tablet and mobile.
- Missing FA/TR/EN/AR titles for title-bearing blocks.
- HTTP external links/images that should use HTTPS.
- Missing localized image alt text.

`/admin/editor/[id]/quality` presents errors and warnings before publishing. The database publish RPC independently re-runs the same deterministic check, so the quality gate cannot be bypassed by calling the existing publish action directly. Warnings remain publishable; blocking errors do not.
