# Version 260 — Guarded Catalog Publish Gate

- Adds `/admin/products/launch` as the final source-backed launch dashboard.
- Readiness is evaluated in the database, not only in the UI.
- A product cannot pass the gate without product-source evidence, four-language names, a real media image, a current branch price, real available warehouse stock, and a payment-ready IRT/Zarinpal branch.
- Variant products are deliberately blocked from bulk publication until their variant commerce state is reviewed separately.
- Missing four-language descriptions are surfaced as a warning rather than silently fabricated.
- `Publish all ready` rechecks the current database state and publishes only rows that still pass every blocker at execution time.
- The publish action is limited to SUPER_ADMIN and EDITOR and is audit logged.
- No product is auto-published by migration or deployment.
