# Version 247 — Real Catalog Launch

## Scope

This phase hardens production catalog ingestion before any real product data is written.

## Changes

- Two-step product import: `preview` then explicit `apply`.
- Server-side preflight for every row before database writes.
- Blocking checks for missing required localized names, unknown category slugs, duplicate SKU values within the same import file, slug conflicts, invalid publish flags, and Published products without a valid price or image.
- Non-blocking warnings for missing price, missing image and zero stock on Draft products.
- Case-insensitive unique indexes for product SKU and slug identity.
- Existing SKU remains the idempotent update key.
- CSV/XLSX/text-PDF limits preserved: 5 MB, 2,000 rows, PDF up to 100 pages.
- Image URLs must be HTTPS or local paths.
- The public CSV template no longer contains fabricated product/specification/price examples.
- No product rows are seeded or published by this migration.

## Production safety

The database migration is additive and was applied while the production product table contained zero rows. It creates no product, inventory, price, brand, media or publication data.

Real catalog rows remain pending source validation and explicit admin import.
