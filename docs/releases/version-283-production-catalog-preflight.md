# Version 283 — Production Catalog Launch Preflight

**Verified:** 2026-09-12  
**Production project:** `hyperdoctor-production`  
**Release decision:** `PREFLIGHT_ONLY_NOT_READY_TO_PUBLISH`

Version 283 is a read-only launch-preflight phase. It does not fabricate catalog data, does not copy historical prices into current commerce state, does not create stock, and does not publish products.

## Verified Production baseline

The current Product Master contains **170 products**. Every product has a verified Hyper Doctor SKU identity, four-language product name, category, brand and ProductSourceEvidence. Exactly **53 JTS products** have verified source-backed media. The remaining **117 products** do not yet have verified media.

The current launch blockers are:

- **117** products missing verified source-backed media: B.Well 50, Hooshmand 43, EGT 24.
- **170** products missing a current launch price for the Production branch.
- **170** products without available real warehouse inventory.
- **23** B.Well products have incomplete four-language descriptions. This remains a warning rather than a hard publish blocker in the existing gate.
- **5** Hooshmand staging SKUs remain `NEEDS_REVIEW` because exact model-specific technical evidence is absent.
- **0** products are currently publish-ready and **0** products are published.

The default `IRAN` branch is published, uses `IRT`, has sales enabled, and is configured for `ZARINPAL`. That branch-level readiness must not be interpreted as product-level sellability: current price and real stock are still absent.

## Fail-closed rules

Version 283 preserves the established launch rules:

1. Historical price lists are reference evidence only and never become a current BranchProductPrice automatically.
2. Historical or inferred stock never becomes WarehouseInventory.
3. Media counts only when ProductMediaEvidence is `VERIFIED` and points to attached, non-empty media.
4. Product publication stays behind the existing database-authoritative launch gate.
5. The five blocked Hooshmand SKUs remain blocked until an exact model-specific technical source is verified. Sibling-model inference is prohibited.
6. This phase is observational and diagnostic. No migration in Version 283 inserts Product, Media, BranchProductPrice, WarehouseInventory or Order rows.

## Version 283 implementation

Version 283 adds a service-role-only `admin_catalog_launch_preflight_v283` RPC and an admin preflight screen. The RPC aggregates current production state without mutating it and exposes:

- Product Master totals and publish-readiness totals.
- Hard blocker counts aligned with the existing publish gate.
- Four-language description warnings.
- Per-brand media/description/current-commerce readiness.
- Default branch commerce state.
- The exact unpromoted staging rows and their validation errors.

The admin screen is available at `/admin/products/preflight` to SUPER_ADMIN and EDITOR roles. It is deliberately read-only and links to the existing remediation workflows for staging, media, commerce and the final publish gate.

## Next execution order

The safe next order is:

1. Source and verify product media for B.Well, Hooshmand and EGT.
2. Complete the 23 missing B.Well four-language descriptions from exact sources.
3. Obtain current price evidence and import BranchProductPrice through the existing current-commerce preflight/apply workflow.
4. Obtain current warehouse counts and import WarehouseInventory through the same controlled workflow.
5. Re-run the launch preflight and existing product publish gate.
6. Publish only products with zero hard blockers.

The machine-readable snapshot for this verified baseline is `docs/releases/version-283-production-catalog-preflight.json`.
