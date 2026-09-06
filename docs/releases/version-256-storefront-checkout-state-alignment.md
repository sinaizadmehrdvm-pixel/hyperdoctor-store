# Version 256 — Storefront Checkout-State Alignment

The storefront now treats checkout readiness as stricter than a generic sales-enabled flag. Product cards and product-detail add-to-cart controls are enabled only when the selected branch is sales-enabled, uses Zarinpal, and operates in IRT — the same payment conditions enforced by the server-side checkout path.

`store-inventory.ts` now exposes `storeCheckoutEnabled` on hydrated products and variants. This closes a UX gap where a branch using MANUAL/DISABLED payment could still show an enabled add-to-cart button even though the payment route would reject checkout.

This release changes no production rows and introduces no fallback or fabricated price/stock behavior.
