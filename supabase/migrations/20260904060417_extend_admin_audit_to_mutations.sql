create or replace function public.admin_record_audit_event(
  p_token text,
  p_action text,
  p_entity text default '',
  p_entity_id text default null,
  p_details jsonb default '{}'::jsonb
) returns boolean
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare v_admin public."AdminUser"%rowtype; v_action text:=btrim(coalesce(p_action,''));
begin
  v_admin:=public._admin_session_user(p_token);
  if v_action='' or char_length(v_action)>120 or v_action !~ '^admin_[a-z0-9_]+$' then raise exception 'invalid_audit_action'; end if;
  insert into public."AdminAuditLog"("adminId","actorName","actorEmail","actorRole",action,entity,"entityId",details)
  values(v_admin.id,v_admin.name,v_admin.email,v_admin.role::text,v_action,left(coalesce(p_entity,''),80),nullif(left(coalesce(p_entity_id,''),200),''),coalesce(p_details,'{}'::jsonb));
  return true;
end;
$function$;

grant execute on function public.admin_record_audit_event(text,text,text,text,jsonb) to anon,authenticated;
