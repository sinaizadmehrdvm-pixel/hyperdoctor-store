# Version 281 — JTS verified product media

Version 281 completes the first verified storefront-media rollout with the full JTS / Jahan Tajhizat Shafa catalog set.

## Scope

- 53 JTS products receive one deterministic storefront WEBP derived from the exact official JTS catalog page already verified in `ProductAssetEvidence`.
- Media are source-derived documentary crops only. No AI-generated, stock, substitute, or inferred imagery is used.
- Each `Media` row is linked to a `VERIFIED` `ProductMediaEvidence` record with the original Library source and exact catalog page.
- Canonical media bytes are stored in a checksum-pinned archive in Git and reconstructed during every build into `public/catalog/verified/jts`.
- Archive SHA-256: `c97a2320f842bd2ef2657de17dd3173d051e8bf3d2b65f8b911666260e2d7eef`.
- The build fails if the archive checksum is wrong, if the extracted count is not exactly 53, or if a file is not a valid WEBP container.
- Production `Media.url` values use immutable static paths: `/catalog/verified/jts/<SKU>.webp`.
- The earlier private `ProductMediaBlob`/verified-only API path remains fail-closed and is not required for JTS static delivery.
- Multilingual alt text remains populated from existing Product master names.
- Version 281 does not publish products and creates no current price, stock, `BranchProductPrice`, or `WarehouseInventory` state.

## Source

Official Jahan Tajhizat Shafa / JTS 55-page catalog, Library file `file_0000000098d481f4a1baa422ec264c0d`.

## Production invariants

- JTS verified media: 53/53
- `Media`: 53 JTS records
- `ProductMediaEvidence`: 53 JTS VERIFIED records
- Static delivery URLs: 53/53
- Published JTS products: 0
- Nonzero JTS Product price/stock: 0
- JTS `BranchProductPrice`: 0
- JTS `WarehouseInventory`: 0
