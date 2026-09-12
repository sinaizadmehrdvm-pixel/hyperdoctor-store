# Version 283 — Production verification method

The Version 283 baseline was obtained from the connected `hyperdoctor-production` Supabase project with read-only SQL queries against Product, ProductSourceEvidence, ProductMediaEvidence, Media, CatalogStagingItem, BranchProductPrice, WarehouseInventory, Branch, BranchCommercePolicy and ProductVariant.

The queries verified counts and readiness state only. No DDL or DML was executed while establishing the baseline.

The canonical machine-readable result is `version-283-production-catalog-preflight.json`; the reproducible read-only query is `version-283-production-catalog-preflight.sql`.
