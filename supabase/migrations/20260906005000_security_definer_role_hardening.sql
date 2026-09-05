-- Version 223 — Security architecture hardening
--
-- The application uses custom Hyper Doctor admin/customer sessions and calls
-- Supabase Data API with the publishable/anon role. Supabase Auth's
-- `authenticated` role is not part of that session model.
--
-- Security goal:
--   * remove implicit PUBLIC execution from every public SECURITY DEFINER RPC;
--   * remove the unused `authenticated` execution surface;
--   * preserve the exact pre-migration anon surface so existing public/custom-
--     session flows keep working;
--   * preserve service_role execution for trusted server/operations use.
--
-- This intentionally does NOT add RLS policies to tables whose design is
-- RPC-only. RLS-with-no-policy remains the deny-by-default table boundary.

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT
      p.oid::regprocedure AS identity,
      has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_before
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, authenticated',
      fn.identity
    );

    -- Keep the existing application/public surface exactly as it was for anon.
    IF fn.anon_before THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', fn.identity);
    ELSE
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', fn.identity);
    END IF;

    -- Explicit trusted-role grant; avoids relying on PUBLIC inheritance.
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.identity);
  END LOOP;
END
$$;
