# Version 252 — Hooshmand Historical Consumer Price Master

## Goal

Stage all 41 SKUs from the supplied Hooshmand Ordibehesht 1405 consumer price list while keeping historical market evidence separate from current Hyper Doctor commerce data.

## Source semantics

- Source type: `PRICE_LIST`
- Period: Ordibehesht 1405 (stored as source-period evidence, not a fabricated Gregorian date)
- Currency: IRR
- Price kind: CONSUMER
- Price policy: HISTORICAL
- Stock policy: IGNORE

Every source price is retained in the staging payload and source evidence. On promotion, Version 249/248 logic stores it as a `ProductPriceObservation`; the Product current selling price remains zero. Inventory also remains zero until a separate current Hyper Doctor source is applied.

## Identity and barcode safety

All 41 source rows remain separate. Source barcodes are preserved exactly, including unusual-length values, but `gtin` stays empty and barcode validation stays `pending` until a dedicated check-digit/format validation succeeds.

## Deliberately not inferred

- current Hyper Doctor selling price
- current stock
- current discount
- GTIN
- product imagery
- product warranty from the price list alone
- unsupported medical or marketing claims

Every staged row remains Draft and requires explicit admin review before Product Master promotion.

No Hooshmand source, staging, price-observation or Product row is created automatically by deployment.
