# Version 283 — Security boundary

`admin_catalog_launch_preflight_v283` is a read-only SECURITY DEFINER RPC. It authenticates the existing admin session token, allows only SUPER_ADMIN and EDITOR roles, revokes execution from PUBLIC/anon/authenticated and grants execution only to `service_role`.

The RPC returns aggregate catalog-launch diagnostics and limited staging blocker metadata. It does not return secret keys, admin credentials, private document contents, current commerce source payloads or full staging evidence JSON.

Version 283 introduces no anonymous database surface and performs no insert/update/delete against catalog or commerce rows.
