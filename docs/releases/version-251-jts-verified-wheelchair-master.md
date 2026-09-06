# Version 251 — Verified JTS Manual Wheelchair Master

## Goal

Prepare a source-backed JTS manual-wheelchair starter for reviewable Product Master staging without inventing current commerce data or brand-relationship claims.

## Included models

- JTS 809E
- JTS 809R
- JTS 809B
- JTS 809C
- JTS 809P
- JTS 809A
- JTS 874A
- JTS 874B
- JTS 874C

The separate `809R – metal spoke` catalogue variant is deliberately not collapsed into the standard 809R record. Similar names remain distinct until a unique source identity can be safely represented.

## Data policy

Catalogue-backed technical attributes are structured under `specs`. Current Hyper Doctor selling price, current inventory, discount, barcode, GTIN, warranty and product images remain unset. All records are Draft.

Hyper Doctor is not documented as an official or authorized JTS representative, so the master pack carries no such claim.

## Admin flow

`/admin/products/staging` can create the verified JTS batch with `IGNORE` price and stock policies. Every row must pass staging validation and receive explicit admin approval before promotion to Product Master.

No JTS source, staging or Product row is created automatically by deployment.
