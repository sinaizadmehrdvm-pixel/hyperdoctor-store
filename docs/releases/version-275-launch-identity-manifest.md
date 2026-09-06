# Version 275 — Launch Identity Manifest

- Adds `/admin/products/identity-manifest` for a flattened view of all active staging identity rows.
- Shows source SKU/model separately from verified Hyper Doctor site SKU.
- Shows unresolved, suggested and verified counts.
- High-confidence suggestions can only be accepted through an explicit admin action; acceptance calls the existing collision-checked site-SKU verification RPC.
- New manifest/suggestion RPCs are service-role-only.
- No Product, price, stock, media or order data is created by the migration.
