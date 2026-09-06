# Version 277 — Legacy Catalog Identity Registry

A private, service-role-only reference registry stores real historical Hyper Doctor product identities for controlled reconciliation.

- Historical product code/name, source row and optional barcode/SKU are preserved.
- Purchase/selling price and initial stock are explicitly historical reference fields.
- The registry never writes Product, BranchProductPrice or WarehouseInventory.
- Direct PUBLIC/anon/authenticated table access is revoked and RLS is enabled.
- Admin search requires SUPER_ADMIN or EDITOR via the existing admin session token.
- This release is rebased cleanly on top of Version 276 and does not replace the already-merged Versions 274–276 work.
