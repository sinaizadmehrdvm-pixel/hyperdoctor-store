# Version 261 — Verified Product Media Workflow

- Adds ProductMediaEvidence as the provenance layer between Media and Product.
- Product media can only be verified when its source reference and source model are explicitly recorded.
- Source model must match the product model number or SKU.
- Existing uploaded media is attached through a dedicated product media workspace; no image is fabricated or auto-fetched.
- Verified media mutations are editor/super-admin only, service-role only at the database boundary, and audit logged.
- Detaching the last verified image from an already published product is blocked.
- The migration creates no Product, Media, ProductMediaEvidence, price, stock or order rows by itself.
