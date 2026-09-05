# Version 225 — Service-role Privilege Cutover

Date: 2026-09-06

## Scope

This release completes the architectural separation prepared in Version 224: admin/customer server RPCs become service-role-only, while genuine guest/public RPCs remain on the publishable/anon path.

## Application changes

- `supabasePrivilegedRpc` is now strict and delegates only to `supabaseServiceRpc`.
- Privileged callers no longer downgrade to the publishable/anon credential when `SUPABASE_SERVICE_ROLE_KEY` is absent; the server fails closed instead.
- The temporary Version 224 build readiness probe is removed from `next.config.ts`.

## Database migration

Migration: `supabase/migrations/20260906011000_privileged_rpc_service_role_cutover.sql`

For every `public.SECURITY DEFINER` function named `admin_*` or `customer_*`, the migration:

1. revokes PostgreSQL `PUBLIC` EXECUTE;
2. revokes Supabase `anon` EXECUTE;
3. revokes Supabase `authenticated` EXECUTE;
4. explicitly grants `service_role` EXECUTE.

True guest/public functions are not touched.

## Dry-run verification

The exact migration body was executed inside a Production transaction and rolled back. The simulated post-cutover privilege result was:

- admin SECURITY DEFINER: 143 total, 0 anon executable
- customer SECURITY DEFINER: 16 total, 0 anon executable

The rollback completed, so Production privileges remain unchanged until the safe deployment gate is met.

## Deployment gate

This migration must not be applied until Version 224 is live on Production and its build confirms that `SUPABASE_SERVICE_ROLE_KEY` is configured in the Production environment. Applying the database revocation before that confirmation could disconnect the currently live admin/customer server flows.

At preparation time, Version 224 source is merged and its full GitHub CI is green, but Vercel rejected the new Production build because the account hit its build-rate limit. Therefore this Version 225 migration is intentionally prepared but not yet applied.
