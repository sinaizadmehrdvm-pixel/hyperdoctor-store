-- Version 225: privileged RPC service-role cutover.
--
-- Admin and customer RPCs are server-only application flows. After Version 224
-- routes those callers through a server-side service-role transport, they no
-- longer need to be executable by the Supabase anon role.
--
-- True guest/public RPCs are intentionally untouched.

DO $cutover$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND (p.proname LIKE 'admin\_%' ESCAPE '\' OR p.proname LIKE 'customer\_%' ESCAPE '\')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn.signature);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', fn.signature);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
  END LOOP;
END
$cutover$;
