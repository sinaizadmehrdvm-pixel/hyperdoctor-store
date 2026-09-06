# Version 248 — Catalog Source Provenance

## Goal

Prevent manufacturer catalogs, historical partner price lists and internal inventory exports from being silently treated as the same kind of commerce data.

## Database

Adds three RLS-protected source tables:

- `CatalogSource` — source type, title, source date, reference and status.
- `ProductSourceEvidence` — immutable-style source snapshot attached to an imported product/source pair.
- `ProductPriceObservation` — source-backed historical price observations with type, currency and observation date.

All direct table access is revoked from `PUBLIC`, `anon` and `authenticated`; service-role-only admin RPCs manage the data.

## Import behavior

Every real import now requires:

- source type and title;
- optional source date/reference;
- explicit price treatment: current, historical-only or ignore;
- explicit stock treatment: current or ignore;
- price kind and currency when a price observation is stored.

Catalog and historical-price imports can therefore create/update Draft product master data without overwriting current Hyper Doctor price or stock. When `historical` is selected, the price is stored in `ProductPriceObservation` and the Product current price remains zero unless a separately verified current source is used.

Product upsert + source evidence attachment runs through `admin_import_product_row_with_source` in one PostgreSQL transaction per row.

## Admin

`/admin/products/sources` provides a source registry and links back to the import workflow.

## Production data safety

The migrations create no source, product, brand, price, inventory or media rows. Existing Product and Brand counts remained zero at migration time.
