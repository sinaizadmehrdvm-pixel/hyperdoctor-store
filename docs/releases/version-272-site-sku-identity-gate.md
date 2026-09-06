# Version 272 — Hyper Doctor Site SKU Identity Gate

Catalog source identifiers are now separated from Hyper Doctor internal product identity.

- `CatalogStagingItem.siteSku` stores the verified Hyper Doctor site SKU.
- `CatalogStagingItem.identityStatus` is `UNRESOLVED` or `VERIFIED`.
- Source model, barcode or supplier SKU is never promoted implicitly as the site SKU.
- A staging row receives blocking error `site_sku_unverified` until a site SKU is explicitly verified.
- Promotion fails closed unless `identityStatus=VERIFIED` and `siteSku` is non-empty.
- Verified site SKUs are case-insensitively unique across active staging rows and checked against Product SKU collisions.
- No Product, price, stock, media or order row is created by this migration.
