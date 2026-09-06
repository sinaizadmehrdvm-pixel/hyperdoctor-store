# Version 262 — Verified Media Launch Gate

- Tightens catalog launch readiness so an arbitrary product image is no longer enough.
- Publish readiness now requires a Media row linked to a VERIFIED ProductMediaEvidence record for that same product.
- Product commerce readiness uses the same verified-media rule.
- Bulk publish remains database authoritative and cannot bypass verified-media provenance.
- Launch UI exposes VERIFIED_IMAGE_MISSING and links directly to the product media verification workspace.
- Adds a CI regression audit for the media provenance RPCs, permission allowlist and launch blocker.
- No product is automatically published and no media row is created by this release.
