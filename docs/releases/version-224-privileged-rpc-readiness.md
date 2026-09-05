# Version 224 — Privileged RPC Transport Readiness

Date: 2026-09-06

## Scope

This release prepares the application for a full separation between true guest RPCs and privileged server-only admin/customer RPCs.

## Changes

- Public Supabase Data API/RPC traffic now always uses a publishable/anon credential path and never silently falls back to the service-role secret.
- Added strict `supabaseServiceRpc` for service-role-only calls.
- Added `supabasePrivilegedRpc`, which prefers `SUPABASE_SERVICE_ROLE_KEY` when safely configured and falls back to the existing publishable transport until the database privilege cutover is completed.
- Admin authentication/session RPCs now use the privileged transport.
- Admin data/mutation/audit RPCs now use the privileged transport.
- Customer registration/login/session/account RPCs now use the privileged transport.

## Environment verification

A temporary build-only readiness probe was added for this phase. The Vercel Preview build reported `service-role=configured`. The probe logs only a boolean configuration state and never prints the secret.

The probe remains only through the Version 224 Production deployment so the Production environment can be verified independently. It must be removed in the following privilege-cutover phase.

## Compatibility design

Version 224 does not revoke anon database EXECUTE privileges yet. This keeps Production fail-safe if any environment lacks the service-role variable or if any server caller remains on the legacy public transport. The next phase should revoke anon EXECUTE only after the Production build confirms that the service-role credential is configured.

## Security improvement already active

Even before the database cutover, public helper code can no longer accidentally elevate itself by using `SUPABASE_SERVICE_ROLE_KEY` as a fallback API key. Privileged server code has an explicit, auditable transport path.
