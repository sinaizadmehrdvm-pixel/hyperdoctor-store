create or replace function public.admin_contact_messages(p_token text, p_search text default '') returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $function$
declare v_admin jsonb; v_result jsonb;
begin
  v_admin:=public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x."createdAt" desc),'[]'::jsonb) into v_result
  from (
    select id,"customerName",phone,email,department,message,locale,status,"createdAt","updatedAt"
    from public."ContactMessage"
    where coalesce(p_search,'')=''
      or "customerName" ilike '%'||p_search||'%'
      or phone ilike '%'||p_search||'%'
      or coalesce(email,'') ilike '%'||p_search||'%'
      or coalesce(department,'') ilike '%'||p_search||'%'
      or message ilike '%'||p_search||'%'
      or coalesce(locale,'') ilike '%'||p_search||'%'
      or status::text ilike '%'||p_search||'%'
  ) x;
  return v_result;
end $function$;
