# Version 268 — Production Health Probe

- Adds `/api/health` as a no-store runtime probe for application-to-Supabase connectivity.
- The probe calls the service-role-only published SEO index and returns only status, published-index counts and latency; no secrets or environment values are exposed.
- Returns HTTP 200 when the server/database path is healthy and HTTP 503 when the database/service-role path is unavailable.
- Adds `test:runtime-a11y` CI coverage for the health probe, multilingual accessibility metadata and the Turkish role-label regression.
