# Version 249 — Product Master Staging

## Goal

Introduce a reviewable source-backed layer between raw catalog evidence and the live `Product` master.

## Database

Adds RLS-protected `CatalogStagingBatch` and `CatalogStagingItem` tables. Direct access is revoked from `PUBLIC`, `anon` and `authenticated`; service-role-only admin RPCs create, validate, review and promote staging records.

A staging item is forced to Draft. It cannot be approved while blocking validation errors remain. Promotion is possible only from `APPROVED` and runs through the Version 248 atomic product + provenance function.

## Commerce safety

Each batch explicitly stores price and stock treatment. Catalog, supplier and historical price-list sources cannot silently set current Hyper Doctor stock; price-list sources cannot silently become current selling price.

When a batch ignores price/stock, promoted Products receive zero current price/stock until a separately verified current source is applied. Historical price observations remain source-backed.

## Admin

- `/admin/products/staging` — batch dashboard and source/policy selection.
- `/admin/products/staging/[id]` — row-level validation, approval/rejection and guarded promotion.
- `/admin/products/sources` links directly to staging.

## Production data safety

The migration creates no source, staging, product, price, stock or media rows. Production verification after migration showed zero Products, zero Catalog Sources, zero staging batches and zero staging items.
