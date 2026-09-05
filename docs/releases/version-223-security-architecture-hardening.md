# Version 223 — Security Architecture Hardening

Date: 2026-09-06

## Scope

This release reduces the execution-role surface of every `public` PostgreSQL `SECURITY DEFINER` RPC without breaking Hyper Doctor's existing custom admin/customer session architecture.

The current server RPC helper uses the configured Supabase publishable/anon key and passes Hyper Doctor's own database session token (`p_token`) to protected RPCs. Because that architecture does not use the Supabase Auth `authenticated` role, retaining blanket `authenticated` EXECUTE privileges was unnecessary. Some older routines also inherited EXECUTE from PostgreSQL `PUBLIC`, which was broader than intended.

## Production baseline

Before this migration, the `public` schema contained 209 `SECURITY DEFINER` functions:

- anon executable: 193
- authenticated executable: 193
- service_role executable: 209
- some routines still had implicit `PUBLIC` EXECUTE

## Change

Migration: `supabase/migrations/20260906005000_security_definer_role_hardening.sql`

For every `public.SECURITY DEFINER` function the migration:

1. Revokes EXECUTE from PostgreSQL `PUBLIC`.
2. Revokes EXECUTE from Supabase `authenticated`.
3. Preserves the exact pre-migration anon surface — a routine is re-granted to anon only when anon could execute it before the migration.
4. Explicitly grants `service_role` EXECUTE.

No table RLS policies were added merely to silence advisor INFO findings. Tables intentionally accessed only through guarded RPCs remain RLS-enabled with no permissive policies, preserving their deny-by-default table boundary.

## Verified production result

After migration:

- total `SECURITY DEFINER`: 209
- anon executable: 193 (unchanged)
- authenticated executable: 0
- PostgreSQL PUBLIC executable: 0
- service_role executable: 209

Representative checks confirm:

- `admin_dashboard(text)`: anon=yes, authenticated=no, service_role=yes
- `customer_dashboard(text)`: anon=yes, authenticated=no, service_role=yes
- `public_rental_catalog_v2(text,text)`: anon=yes, authenticated=no, service_role=yes

Sixteen internal/server-sensitive routines remain closed to anon, including trigger/helper routines and the password-reset mutation functions that were already non-anon before this release.

## Supabase Security Advisor

The previous `authenticated_security_definer_function_executable` warnings are removed by the migration.

`anon_security_definer_function_executable` warnings intentionally remain for the 193 functions that the current production application reaches through the publishable/anon role. Blindly revoking those privileges would break public routes and the current custom-session admin/customer server flows.

`rls_enabled_no_policy` INFO findings also remain where the no-policy state is the intended deny-by-default design.

## Compatibility smoke

After applying the migration directly to Production Supabase, the following Production routes returned HTTP 200:

- `/fa/rental` — public RPC-backed rental page, Persian RTL
- `/admin/login`
- `/fa/account/login`

No test credentials were fabricated, so this release does not claim a successful real admin/customer credential login. Permission checks and route availability were verified structurally; authenticated business flows remain protected by their existing custom `p_token` validation.

## Remaining architecture stage

A future stage can split privileged server-only admin/customer RPC calls from true guest RPCs completely. That requires first confirming a server-only service-role credential is configured safely for every deployment environment, migrating privileged server callers to a dedicated service-role client, and only then revoking anon EXECUTE from those privileged functions. Version 223 deliberately does not make that unsafe credential assumption.
