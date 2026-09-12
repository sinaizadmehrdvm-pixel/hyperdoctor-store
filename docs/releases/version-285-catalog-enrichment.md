# Version 285 — Catalog Enrichment & Launch Readiness

Date: 2026-09-12  
Branch: `phase-285-catalog-enrichment-launch-readiness`  
Base: `b487cc38477b1008c63fb92ec7e10adad1db9ae1`

## Outcome

Version 285 closes the two source-content gaps identified by Version 283 without creating any live commerce state:

- **23/23 B.Well description gaps** receive source-derived FA/TR/EN/AR descriptions.
- **117/117 missing verified-media gaps** receive deterministic WEBP crops from the exact cited source documents.
- Product Master becomes **170/170 four-language descriptions** and **170/170 verified media**.
- **0 current branch prices**, **0 available inventory**, **0 published products**, and therefore **0 publish-ready products** remain intentional.
- The five blocked Hooshmand staging SKUs remain `NEEDS_REVIEW` and unpromoted.

## Source media

Version 285 adds 117 source-derived 240×240 WEBP files to the existing verified-media delivery path.

- Runtime delivery: immutable static source-derived bundle reconstructed during build
- Delivery path: `/catalog/verified/v285/<SKU>.webp`
- Asset-set SHA-256: `9361ab2f6c9c65e83559b4954d38ea876a7b414463180062ce00820aadcc5471`
- B.Well: 50 assets from `file_00000000607081f4a272b35d4ba49b7b`
- Hooshmand: 43 assets from `file_000000000f288246ba4de06e2f1113ce` plus the three explicitly mapped `+` products from `file_00000000937881f4a2e5682e049d7c42`
- EGT: 24 assets from `file_0000000061dc81f4b64b0e8c03428808`

The repository manifest records source file ID, page, model, PDF crop box, asset SHA-256, byte size, and visual scope for every asset. The build verifies and extracts the checksum-pinned repository archive and refuses any file whose byte size or SHA-256 differs from the manifest. No generated, stock, synthetic, or sibling-model-substitute imagery is used.

### EGT shared family visuals

Eleven EGT SKUs use an **official family visual** rather than pretending the catalogue supplies visually distinct hardware for each mode/capacity. These are explicitly marked `OFFICIAL_FAMILY_VISUAL` in the manifest and evidence notes. The corresponding source page itself explicitly lists the affected variants. This is not sibling-model inference.

The remaining 106 new assets are marked `EXACT_PRODUCT_VISUAL`.

## B.Well descriptions

The 23 localized descriptions are constrained to facts already captured from the official 2025–2026 B.Well catalogue/staging evidence. No new medical, regulatory, warranty, commerce, or availability claims are introduced. `BW-PRO-22` intentionally remains generic because its verified staging evidence does not enumerate additional feature claims.

## Fail-closed commerce

Version 285 explicitly refuses to:

- publish Product Master rows;
- create or infer `BranchProductPrice`;
- create or infer `WarehouseInventory`;
- set nonzero legacy `Product.price` or `Product.stock`;
- resolve the five blocked Hooshmand rows.

The remaining launch blockers after this phase are operational data: **170 current branch prices** and **170 available inventory records**.

## Verification

`npm run test:catalog-enrichment` verifies:

- the 117-entry source manifest and all per-file hashes/provenance records;
- 50 B.Well + 43 Hooshmand + 24 EGT media mappings;
- 106 exact-product + 11 official-family visual classifications;
- exact source file/page provenance;
- 23 localized B.Well description rows;
- the five blocked Hooshmand SKUs remain fail-closed;
- no price, inventory, order, or product-publication writes are introduced.

Production closeout additionally verifies representative static v285 media endpoints after deployment and confirms the database media URLs exactly match the checksum-pinned source manifest.
