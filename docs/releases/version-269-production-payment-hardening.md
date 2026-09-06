# Version 269 — Production Payment Hardening

- Production payment requests now fail closed when Zarinpal sandbox mode is enabled.
- Placeholder or missing Merchant IDs are rejected.
- Production callback origin must be a non-local HTTPS URL.
- Verification reports unavailable when the payment runtime is not ready.
- No secret values are exposed.
