# Version 259 — Verified Current Commerce Import

- Adds a dedicated branch-aware import for current Hyper Doctor price and warehouse stock.
- Supports CSV and XLSX with `sku`, `price`, `compareAtPrice`, and `onHand` columns.
- Every import runs a server/database preflight before any write.
- Unknown SKUs, invalid prices/stocks, compare-at inconsistencies, and variant products are blocked.
- Apply is transactional and writes BranchProductPrice plus WarehouseInventory only after explicit confirmation.
- A CommerceSource and CommerceDataEvidence trail records where the current commerce data came from.
- Current commerce sources are distinct from historical catalog/price-list provenance.
- The blank template contains headers only; no fake product row is shipped.
- No product, price, stock, order, or commerce-source row is created by the migration itself.
