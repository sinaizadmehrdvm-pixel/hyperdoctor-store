# Version 242 — Future Function Default Privilege Hardening

Prevents future `public` schema functions from silently inheriting executable access for browser-facing roles.

## Shipped
- Changes default function privileges for both `postgres` and `supabase_admin` in schema `public`.
- Revokes default function `EXECUTE` from `PUBLIC`, `anon`, and `authenticated`.
- Keeps explicit default `EXECUTE` for `service_role`.
- Existing functions are not rewritten by this migration; intentional guest/public RPCs remain unchanged.

This closes the regression path where a newly-created privileged RPC could otherwise become anonymously executable merely because its migration forgot an explicit revoke/grant block.

No application content rows are created, modified, or deleted.
