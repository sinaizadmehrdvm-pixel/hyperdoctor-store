# Version 243 — Public RPC Exposure Closeout

Closes anonymous access to application `SECURITY DEFINER` RPCs now that all application RPC traffic is server-side and Production has a verified `SUPABASE_SERVICE_ROLE_KEY`.

## Application transport
- `supabaseRpc` now uses the strict service-role server transport.
- `supabasePrivilegedRpc` continues to use the same strict service-role transport.
- Public table reads through `supabaseSelect` remain on the publishable key.

## Database privilege closeout
- Revokes `EXECUTE` from `PUBLIC`, `anon`, and `authenticated` on every `SECURITY DEFINER` function in the exposed `public` schema.
- Grants explicit execution to `service_role`.
- Moves the storage upload validation helper out of the exposed `public` RPC schema into `app_private`.
- Rebinds the existing `storage.objects` upload policy to `app_private.storage_upload_grant_valid`.
- The private storage helper remains executable by `anon`/`authenticated` only because the Storage RLS policy evaluates it; it is not exposed as a public-schema RPC.

## Regression guard
- Adds `scripts/audit-public-rpc-grants.ts`.
- CI now fails if a migration from the v243 cutoff forward grants function `EXECUTE` to `anon` or `authenticated`, except the explicitly private storage-policy helper.

## Safety
- No application content rows are inserted, updated, or deleted.
- The migration is intended to be applied only after the v243 application build is deployed and READY in Production.
