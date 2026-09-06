# Version 257 — Verified Catalog Launch Activation

- Adds idempotent activation for the three source-backed launch packs: B.Well, JTS and Hooshmand.
- A single admin action stages all 59 verified records without publishing anything.
- Existing non-archived verified batches are reused instead of duplicated.
- Current Hyper Doctor price, stock, images and warranty remain unset unless independently verified.
- Adds service-role-only bulk staging review/promotion RPCs for controlled operational use.
- No production product, order, price or inventory rows are created by the migration itself.
