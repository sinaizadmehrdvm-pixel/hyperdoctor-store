# Version 273 — Staging Identity Review UI

The catalog staging review screen now exposes source identity separately from Hyper Doctor site identity.

- Admin can enter and verify the real Hyper Doctor site SKU per staging row.
- Source model/barcode/SKU remains visible for reconciliation.
- Approve and Promote remain unavailable while identity validation has blocking errors.
- Bulk promotion still creates Draft Product rows only and cannot bypass the database identity gate.
- The workflow is localized for FA/TR/EN/AR.
- CI adds `test:site-sku-identity` regression coverage.
