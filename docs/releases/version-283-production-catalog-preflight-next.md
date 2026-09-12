# Version 283 — Next-step execution queue

This queue follows the verified Production preflight and remains fail-closed.

1. **Verified media — B.Well (50 products):** source exact product images and record ProductMediaEvidence only after model/SKU match.
2. **Verified media — Hooshmand (43 promoted products):** use exact model-specific source assets; never reuse sibling images.
3. **Verified media — EGT (24 products):** attach only source-backed exact product media.
4. **B.Well descriptions (23 products):** complete FA/TR/EN/AR descriptions only from exact product sources.
5. **Current price import (170 products currently missing):** use current verified commerce evidence and BranchProductPrice; historical price lists stay reference-only.
6. **Real inventory import (170 products currently unavailable):** use current warehouse evidence and WarehouseInventory; never infer stock.
7. **Five blocked Hooshmand staging SKUs:** retain NEEDS_REVIEW until exact technical source exists.
8. **Re-run preflight and publish gate:** only zero-hard-blocker products may be published.

Version 283 itself performs no catalog/commerce mutation and no publication.
