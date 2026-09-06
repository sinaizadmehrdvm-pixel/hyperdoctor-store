# Version 253 — Product Commerce Readiness

## Goal

Make the admin and storefront distinguish between a product that exists in the catalog and a product that is actually ready to be sold.

## Readiness rules

A sellable product now requires real, branch-aware commerce data:

- product is published;
- at least one real product image is registered;
- branch sales are enabled;
- an effective current selling price is greater than zero;
- available warehouse inventory is greater than zero;
- for products with variants, at least one published variant must have both effective price and available stock.

`admin_product_commerce_readiness` returns catalog, sale and checkout readiness plus per-branch blockers. It is service-role-only and requires an authenticated SUPER_ADMIN or EDITOR session.

## Admin UI

`/admin/products/[id]` now shows:

- catalog readiness;
- sale readiness;
- checkout readiness;
- image count;
- per-branch price and available inventory;
- ready/published variant counts;
- explicit blocker reason codes.

Catalog-only products remain allowed, but they are clearly marked as not sellable until current commerce data is complete.

## Storefront

The shared Add-to-Cart control refuses product purchase when the current effective price is missing/zero or no real image is present. This is only a UX guard; Version 254 adds the authoritative server-side checkout guard.

## Data safety

The migration creates no Product, Media, inventory, price, order or payment rows.