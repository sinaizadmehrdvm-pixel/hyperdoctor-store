# Version 241 — Service-role Privilege Cutover

Moves privileged Hyper Doctor admin/customer RPC transport to strict Supabase service-role execution.

## Shipped
- `supabasePrivilegedRpc` now fails closed and always delegates to `supabaseServiceRpc`.
- The temporary Vercel service-role readiness build probe is removed after Production proved the key is configured.
- A database migration revokes `EXECUTE` from `PUBLIC`, `anon` and `authenticated` for every `public.SECURITY DEFINER` function whose name starts with `admin_` or `customer_`.
- `service_role` keeps explicit execute permission on those functions.
- Intentional guest/public RPC families are left unchanged.

## Deployment order
1. Deploy strict service-role server transport to Production.
2. Verify Production is READY and public/login routes still render.
3. Apply the database privilege migration.
4. Verify admin/customer anonymous execution is zero and service-role execution remains available.

No production content rows are created or modified by this phase.
