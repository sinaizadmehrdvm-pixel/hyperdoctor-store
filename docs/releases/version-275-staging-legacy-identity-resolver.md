# Version 275 — Staging Legacy Identity Resolver

Catalog staging now has an explicit identity-reconciliation workflow.

- Each unresolved staging row links to a dedicated resolver.
- Candidates are scored from historical identity data using source model/barcode/name signals.
- Candidates never auto-assign a site SKU; an admin must explicitly choose or manually enter the verified Hyper Doctor SKU.
- Historical price/stock are visibly labeled and never applied as current commerce data.
- A searchable legacy identity registry is available at `/admin/products/identity`.
- CI includes `test:legacy-identity` regression coverage.
