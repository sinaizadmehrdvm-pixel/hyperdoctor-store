# Version 250 — Verified B.Well Starter Master

## Goal

Turn verified information from the supplied B.Well 2025–2026 English catalogue into a controlled starter master pack without fabricating commerce data.

## Included starter models

- PRO-118
- PRO-110
- PRO-100
- MED-120
- MED-130
- MED-111
- MED-325
- PRO-310
- MED-320

The starter contains only source-backed model identity and technical details that are unambiguous in the supplied catalogue. Product names are localized for FA/TR/EN/AR while model identifiers remain unchanged.

## Deliberately left unset

- current Hyper Doctor selling price
- current Hyper Doctor inventory
- current promotion
- barcode / GTIN
- warranty terms
- product images
- country of manufacture when not unambiguously established for the product

Every starter product remains Draft and is staged before Product Master promotion.

## Admin action

`/admin/products/staging` includes a one-click action that:

1. registers/reuses the supplied B.Well catalogue as a confirmed `CatalogSource`;
2. creates a staging batch with `IGNORE` current price and stock policies;
3. inserts the nine verified rows into staging;
4. runs row validation;
5. requires explicit admin approval before any Product row can be created.

No starter rows are automatically inserted by migration or deployment.
