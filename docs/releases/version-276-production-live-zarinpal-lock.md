# Version 276 — Production Live Zarinpal Lock

- Production runtime is permanently routed to Zarinpal live endpoints; Preview/Development may still use `ZARINPAL_SANDBOX`.
- This removes dependence on stale or duplicated Vercel sandbox environment values for live Production traffic.
- Merchant ID and Production HTTPS site URL remain mandatory fail-closed readiness checks.
- Production commerce can still be disabled through `BranchCommercePolicy.salesEnabled`; sandbox is not used as a Production kill switch.
- No payment request is created by this release or its tests.
