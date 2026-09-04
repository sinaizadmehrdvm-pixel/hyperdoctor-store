create table if not exists public."AdminAuditLog" (
  id text primary key default gen_random_uuid()::text,
  "adminId" text references public."AdminUser"(id) on delete set null,
  "actorName" text not null default '',
  "actorEmail" text not null default '',
  "actorRole" text not null default '',
  action text not null,
  entity text not null default '',
  "entityId" text,
  details jsonb not null default '{}'::jsonb,
  "createdAt" timestamp without time zone not null default current_timestamp
);
create index if not exists "AdminAuditLog_createdAt_idx" on public."AdminAuditLog"("createdAt" desc);
create index if not exists "AdminAuditLog_adminId_idx" on public."AdminAuditLog"("adminId");
alter table public."AdminAuditLog" enable row level security;

create or replace function public._admin_super_user(p_token text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v_admin public."AdminUser"%rowtype;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role::text <> 'SUPER_ADMIN' then raise exception 'forbidden'; end if;
  return jsonb_build_object('id',v_admin.id,'email',v_admin.email,'name',v_admin.name,'role',v_admin.role::text);
end;
$function$;

create or replace function public.admin_team_list(p_token text, p_search text default '')
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v_actor jsonb; v_q text := btrim(coalesce(p_search,''));
begin
  v_actor := public._admin_super_user(p_token);
  return coalesce((select jsonb_agg(to_jsonb(x) order by x."createdAt" asc) from (
    select u.id,u.email,u.name,u.role::text as role,u."isActive",u."createdAt",u."updatedAt",
      (select count(*)::int from public."AdminSession" s where s."adminId"=u.id and s."revokedAt" is null and s."expiresAt">now()) as "activeSessions",
      (select max(s."lastSeenAt") from public."AdminSession" s where s."adminId"=u.id) as "lastSeenAt"
    from public."AdminUser" u
    where v_q='' or u.email ilike '%'||v_q||'%' or u.name ilike '%'||v_q||'%' or u.role::text ilike '%'||v_q||'%'
  ) x),'[]'::jsonb);
end;
$function$;

create or replace function public.admin_team_save(p_token text,p_id text,p_name text,p_email text,p_role text,p_password text,p_is_active boolean)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v_actor jsonb; v_actor_id text; v_target public."AdminUser"%rowtype; v_id text; v_role public."AdminRole"; v_active boolean:=coalesce(p_is_active,true); v_password text:=coalesce(p_password,''); v_role_changed boolean:=false;
begin
  v_actor:=public._admin_super_user(p_token); v_actor_id:=v_actor->>'id';
  if p_name is null or char_length(btrim(p_name))<2 or char_length(btrim(p_name))>120 then raise exception 'invalid_name'; end if;
  if p_email is null or position('@' in btrim(p_email))<2 or char_length(btrim(p_email))>254 then raise exception 'invalid_email'; end if;
  if p_role not in ('SUPER_ADMIN','EDITOR','SUPPORT','SALES') then raise exception 'invalid_role'; end if;
  v_role:=p_role::public."AdminRole";
  if nullif(btrim(coalesce(p_id,'')),'') is null then
    if char_length(v_password)<12 or char_length(v_password)>200 then raise exception 'password_length'; end if;
    v_id:=gen_random_uuid()::text;
    insert into public."AdminUser"(id,email,"passwordHash",name,role,"isActive","createdAt","updatedAt") values(v_id,lower(btrim(p_email)),crypt(v_password,gen_salt('bf',12)),btrim(p_name),v_role,v_active,now(),now());
    insert into public."AdminAuditLog"("adminId","actorName","actorEmail","actorRole",action,entity,"entityId",details) values(v_actor_id,v_actor->>'name',v_actor->>'email',v_actor->>'role','ADMIN_CREATED','AdminUser',v_id,jsonb_build_object('email',lower(btrim(p_email)),'role',p_role,'isActive',v_active));
  else
    select * into v_target from public."AdminUser" where id=p_id for update;
    if not found then raise exception 'admin_not_found'; end if;
    if p_id=v_actor_id and (v_role::text<>'SUPER_ADMIN' or not v_active) then raise exception 'cannot_demote_or_disable_self'; end if;
    if p_id=v_actor_id and v_password<>'' then raise exception 'cannot_reset_own_password_here'; end if;
    if v_target.role::text='SUPER_ADMIN' and (v_role::text<>'SUPER_ADMIN' or not v_active) and (select count(*) from public."AdminUser" where role='SUPER_ADMIN'::public."AdminRole" and "isActive"=true)<=1 then raise exception 'last_super_admin'; end if;
    if v_password<>'' and (char_length(v_password)<12 or char_length(v_password)>200) then raise exception 'password_length'; end if;
    v_role_changed:=v_target.role::text<>v_role::text;
    update public."AdminUser" set email=lower(btrim(p_email)),name=btrim(p_name),role=v_role,"isActive"=v_active,"passwordHash"=case when v_password<>'' then crypt(v_password,gen_salt('bf',12)) else "passwordHash" end,"updatedAt"=now() where id=p_id;
    if (not v_active) or v_role_changed or v_password<>'' then update public."AdminSession" set "revokedAt"=now() where "adminId"=p_id and "revokedAt" is null; end if;
    insert into public."AdminAuditLog"("adminId","actorName","actorEmail","actorRole",action,entity,"entityId",details) values(v_actor_id,v_actor->>'name',v_actor->>'email',v_actor->>'role','ADMIN_UPDATED','AdminUser',p_id,jsonb_build_object('email',lower(btrim(p_email)),'role',p_role,'isActive',v_active,'passwordReset',v_password<>''));
    v_id:=p_id;
  end if;
  return (select jsonb_build_object('id',u.id,'email',u.email,'name',u.name,'role',u.role::text,'isActive',u."isActive") from public."AdminUser" u where u.id=v_id);
end;
$function$;

create or replace function public.admin_team_revoke_sessions(p_token text,p_id text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v_actor jsonb; v_count int;
begin
  v_actor:=public._admin_super_user(p_token);
  if p_id=v_actor->>'id' then raise exception 'cannot_revoke_own_session_here'; end if;
  if not exists(select 1 from public."AdminUser" where id=p_id) then raise exception 'admin_not_found'; end if;
  update public."AdminSession" set "revokedAt"=now() where "adminId"=p_id and "revokedAt" is null and "expiresAt">now(); get diagnostics v_count=row_count;
  insert into public."AdminAuditLog"("adminId","actorName","actorEmail","actorRole",action,entity,"entityId",details) values(v_actor->>'id',v_actor->>'name',v_actor->>'email',v_actor->>'role','ADMIN_SESSIONS_REVOKED','AdminUser',p_id,jsonb_build_object('revokedSessions',v_count));
  return jsonb_build_object('ok',true,'revokedSessions',v_count);
end;
$function$;

create or replace function public.admin_audit_logs(p_token text,p_search text default '',p_action text default '')
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v_actor jsonb; v_q text:=btrim(coalesce(p_search,'')); v_action text:=btrim(coalesce(p_action,''));
begin
  v_actor:=public._admin_super_user(p_token);
  return coalesce((select jsonb_agg(to_jsonb(x) order by x."createdAt" desc) from (select id,"adminId","actorName","actorEmail","actorRole",action,entity,"entityId",details,"createdAt" from public."AdminAuditLog" where (v_q='' or "actorName" ilike '%'||v_q||'%' or "actorEmail" ilike '%'||v_q||'%' or action ilike '%'||v_q||'%' or entity ilike '%'||v_q||'%' or coalesce("entityId",'') ilike '%'||v_q||'%') and (v_action='' or action=v_action) order by "createdAt" desc limit 500) x),'[]'::jsonb);
end;
$function$;

revoke all on table public."AdminAuditLog" from anon, authenticated;
grant execute on function public.admin_team_list(text,text) to anon, authenticated;
grant execute on function public.admin_team_save(text,text,text,text,text,text,boolean) to anon, authenticated;
grant execute on function public.admin_team_revoke_sessions(text,text) to anon, authenticated;
grant execute on function public.admin_audit_logs(text,text,text) to anon, authenticated;
