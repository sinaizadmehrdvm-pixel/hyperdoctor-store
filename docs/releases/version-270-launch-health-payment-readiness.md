# Version 270 — Launch Health Payment Readiness

- `/api/health` now checks both Supabase reachability and payment runtime readiness.
- Production health returns HTTP 503 if Merchant, sandbox mode or production site URL is unsafe for live payment.
- Health output contains only boolean/readiness state and blocker codes; no secrets.
- CI includes `test:payment-prod` regression coverage.
