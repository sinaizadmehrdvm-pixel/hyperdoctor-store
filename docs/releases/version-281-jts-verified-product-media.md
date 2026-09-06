# Version 281 — JTS verified product media

Version 281 starts the verified storefront-media rollout with the complete JTS / Jahan Tajhizat Shafa catalog set.

## Scope

- 53 JTS products receive one deterministic storefront WEBP derived from the exact official JTS catalog page already verified in `ProductAssetEvidence`.
- Media are source-derived documentary crops only. No AI-generated, stock, substitute, or inferred product imagery is used.
- Each `Media` row is linked to a `VERIFIED` `ProductMediaEvidence` record with the original Library source file and exact catalog page.
- Multilingual alt text is populated from the existing Product master names.
- The media bundle is checksum-pinned and deterministically extracted into `public/catalog/verified/jts` during build.
- Version 281 remains fail-closed for commerce: no product is published and no current product/branch price or stock is created.

## Source

Official Jahan Tajhizat Shafa / JTS 55-page catalog, Library file `file_0000000098d481f4a1baa422ec264c0d`.

## Expected Production result

- JTS verified media: 53/53
- Total `Media`: +53
- Total `ProductMediaEvidence`: +53
- Published products: unchanged at 0
- Current product price/stock: unchanged at 0
- `BranchProductPrice`: unchanged at 0
- `WarehouseInventory`: unchanged at 0
