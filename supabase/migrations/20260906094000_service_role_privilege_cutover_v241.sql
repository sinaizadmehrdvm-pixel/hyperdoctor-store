do $$
declare
  fn record;
begin
  for fn in
    select
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and (p.proname like 'admin\_%' escape '\' or p.proname like 'customer\_%' escape '\')
  loop
    execute format('revoke execute on function %I.%I(%s) from public', fn.schema_name, fn.function_name, fn.identity_args);
    execute format('revoke execute on function %I.%I(%s) from anon', fn.schema_name, fn.function_name, fn.identity_args);
    execute format('revoke execute on function %I.%I(%s) from authenticated', fn.schema_name, fn.function_name, fn.identity_args);
    execute format('grant execute on function %I.%I(%s) to service_role', fn.schema_name, fn.function_name, fn.identity_args);
  end loop;
end
$$;
