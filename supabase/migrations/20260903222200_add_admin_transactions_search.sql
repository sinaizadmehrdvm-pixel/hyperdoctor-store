create or replace function public.admin_transactions(p_token text, p_search text default '') returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $function$
declare v_admin jsonb; v_result jsonb;
begin
  v_admin:=public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x."createdAt" desc),'[]'::jsonb) into v_result
  from (
    select id,"orderNumber","customerName",total,status::text as status,gateway::text as gateway,"paymentRefId","createdAt"
    from public."Order"
    where coalesce(p_search,'')=''
      or "orderNumber" ilike '%'||p_search||'%'
      or "customerName" ilike '%'||p_search||'%'
      or coalesce("paymentRefId",'') ilike '%'||p_search||'%'
      or coalesce(gateway::text,'') ilike '%'||p_search||'%'
      or status::text ilike '%'||p_search||'%'
    order by "createdAt" desc
    limit 500
  ) x;
  return v_result;
end $function$;
