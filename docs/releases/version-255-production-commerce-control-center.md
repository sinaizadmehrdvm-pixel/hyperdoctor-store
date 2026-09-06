# Version 255 — Production Commerce Control Center

Version 255 consolidates launch-critical commerce data into `/admin/commerce` for SUPER_ADMIN and SALES roles.

The workspace is branch-aware and shows product sellability from the same production rules used by checkout: published state, real media, branch sales policy, Zarinpal/IRT eligibility, effective branch price, and warehouse availability. Products with variants are explicitly routed to variant management rather than pretending product-level inventory is sufficient.

Price updates use the existing `admin_upsert_branch_product_price` service-role RPC. Warehouse stock updates use `admin_set_warehouse_inventory`; reserved stock cannot exceed on-hand stock. No automatic price, inventory, product, order, branch, or warehouse rows are created by this release.

A new `admin_commerce_control_center` SECURITY DEFINER RPC is callable only through `service_role`; anon and authenticated EXECUTE privileges are revoked. The migration is additive and does not modify existing commerce rows.
