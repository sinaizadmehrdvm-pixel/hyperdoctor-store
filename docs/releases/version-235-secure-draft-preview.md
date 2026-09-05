# Version 235 — Secure Draft Preview

Date: 2026-09-06

## Implemented

- Token-gated preview links for the latest saved visual-builder draft.
- Preview tokens are generated with cryptographic random bytes and only a SHA-256 digest is persisted.
- Expiration presets: 15 minutes, 1 hour, 24 hours and 7 days.
- Explicit revoke support and preview history for admins.
- Public preview route supports fa/tr/en/ar and is marked noindex/nofollow.
- Draft preview never changes the published document.
- Invalid, expired or revoked tokens return no preview document.

The additive Production migration was applied without creating any preview token.