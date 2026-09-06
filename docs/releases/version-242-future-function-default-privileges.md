# Version 242 — Future Function Default Privilege Hardening

Prevents future application-created `public` schema functions from silently inheriting executable access for browser-facing roles.

## Shipped
- Changes default function privileges for the `postgres` migration owner in schema `public`.
- Revokes default function `EXECUTE` from `PUBLIC`, `anon`, and `authenticated`.
- Keeps explicit default `EXECUTE` for `service_role`.
- Existing functions are not rewritten by this migration; intentional guest/public RPCs remain unchanged.

## Managed-role boundary
Production inspection shows all current application SECURITY DEFINER functions are owned by `postgres`. Supabase's managed `supabase_admin` role has its own default ACLs, but the project migration session is not a member of that managed role and cannot change its defaults. Attempting to do so correctly fails with PostgreSQL permission denied. The migration therefore hardens the actual application function owner instead of including an unexecutable managed-role statement.

This closes the regression path for project migrations where a newly-created privileged RPC could otherwise become anonymously executable merely because its migration forgot an explicit revoke/grant block.

No application content rows are created, modified, or deleted.
