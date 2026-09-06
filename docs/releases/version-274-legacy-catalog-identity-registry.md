# Version 274 — Legacy Catalog Identity Registry

A private, service-role-only reference registry now stores real historical Hyper Doctor product identities from the prepared import workbook.

- Historical product code/name, source row and optional barcode/SKU are preserved.
- Purchase/selling price and initial stock are explicitly historical fields.
- The registry never writes Product, BranchProductPrice or WarehouseInventory.
- Direct PUBLIC/anon/authenticated table access is revoked and RLS is enabled.
- Admin search requires SUPER_ADMIN or EDITOR via the existing admin session token.
