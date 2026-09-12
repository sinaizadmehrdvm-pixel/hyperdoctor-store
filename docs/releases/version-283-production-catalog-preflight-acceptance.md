# Version 283 — Acceptance gates

Version 283 may be merged only when all of the following are true:

- Main CI succeeds, including `test:catalog-preflight` and the production build.
- Dedicated Version 283 preflight workflow succeeds.
- The migration remains read-only for Product, Media, BranchProductPrice, WarehouseInventory and Order rows.
- The new RPC is service-role-only and performs an authenticated SUPER_ADMIN/EDITOR check.
- The admin page compiles and displays the dynamic Production preflight without any publish mutation.
- The verified baseline remains: 170 products, 170 source-backed, 53 verified-media products, 117 missing verified media, 170 missing current prices, 170 missing available inventory, 23 description warnings, five technical-source staging blockers, zero publish-ready and zero published products.

After merge and a READY Production deployment, apply the additive RPC migration, verify the RPC against Production, and run Security Advisor. Do not publish or populate commerce data as part of Version 283.
