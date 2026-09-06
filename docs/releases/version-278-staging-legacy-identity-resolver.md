# Version 278 — Staging Legacy Identity Resolver

Catalog staging now has an explicit legacy identity-reconciliation workflow on top of the current Version 276 main branch.

- Each unresolved staging row links to a dedicated resolver.
- Candidates are scored from historical identity data using source model, barcode, source SKU, name and brand signals.
- Candidates never auto-assign a site SKU; an admin must explicitly choose or manually enter the verified Hyper Doctor SKU.
- Historical price/stock are visibly labeled and never applied as current commerce data.
- A searchable legacy identity registry is available at `/admin/products/identity`.
- CI runs both the already-merged identity reconciliation audit and the new `test:legacy-identity` regression audit before build.
