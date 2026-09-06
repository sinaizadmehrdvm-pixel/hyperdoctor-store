# Version 264 — Production Runtime Readiness

- Launch Operations now reports server-side readiness for `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `ZARINPAL_MERCHANT_ID` and `ZARINPAL_SANDBOX` without exposing secret values.
- Production branch readiness is visible alongside the catalog and commerce pipeline.
- Adds `test:launch-ops` CI guard to prevent removal of provenance, inventory, payment-runtime and service-role checks.
- The diagnostics are read-only; no synthetic rows or automatic publishing are performed.
- Positive payment E2E still requires a real published product plus real price, inventory and a production merchant configuration.
