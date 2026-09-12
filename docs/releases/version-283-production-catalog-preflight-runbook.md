# Version 283 — Rollout runbook

1. Merge only after both CI workflows pass.
2. Wait for the merged main Vercel Production deployment to become READY.
3. Apply `20260912124500_catalog_launch_preflight_v283.sql` to `hyperdoctor-production`.
4. Verify function grants: service_role execute only; PUBLIC/anon/authenticated denied.
5. Open `/admin/products/preflight` with an authorized admin session and confirm the live snapshot.
6. Re-run the read-only Production verification SQL and compare with the Version 283 manifest.
7. Run Supabase Security Advisor after the DDL change.
8. Do not create prices, stock, media, products, orders, or publication state in this rollout.
