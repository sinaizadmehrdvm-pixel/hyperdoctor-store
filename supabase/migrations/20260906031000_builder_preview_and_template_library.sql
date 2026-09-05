-- Versions 235-236 — Secure Draft Preview + Reusable Page Template Library
-- Additive only. Does not publish or modify existing page content automatically.

create table if not exists public."BuilderPreviewToken" (
  id text primary key default replace(gen_random_uuid()::text,'-',''),
  "pageId" text not null references public."Page"(id) on delete cascade,
  "tokenHash" text not null unique,
  "expiresAt" timestamptz not null,
  "createdByAdminId" text,
  "createdAt" timestamptz not null default now(),
  "revokedAt" timestamptz
);

create index if not exists "BuilderPreviewToken_pageId_expiresAt_idx"
  on public."BuilderPreviewToken"("pageId", "expiresAt" desc);

create table if not exists public."BuilderTemplateLibrary" (
  id text primary key default replace(gen_random_uuid()::text,'-',''),
  name text not null,
  description text not null default '',
  document jsonb not null,
  "createdByAdminId" text,
  "updatedByAdminId" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "BuilderTemplateLibrary_updatedAt_idx"
  on public."BuilderTemplateLibrary"("updatedAt" desc);

alter table public."BuilderPreviewToken" enable row level security;
alter table public."BuilderTemplateLibrary" enable row level security;

create or replace function public.admin_builder_preview_create(
  p_token text,
  p_page_id text,
  p_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_admin jsonb;
  v_raw text;
  v_hash text;
  v_id text;
  v_expires timestamptz;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if coalesce(v_admin->>'role','') not in ('SUPER_ADMIN','EDITOR') then raise exception 'forbidden'; end if;
  if not exists(select 1 from public."PageBuilderDocument" where "pageId"=p_page_id) then raise exception 'draft_not_found'; end if;
  p_minutes := greatest(5, least(coalesce(p_minutes,60), 10080));
  v_raw := encode(gen_random_bytes(32),'hex');
  v_hash := encode(digest(v_raw,'sha256'),'hex');
  v_expires := now() + make_interval(mins => p_minutes);
  insert into public."BuilderPreviewToken"("pageId","tokenHash","expiresAt","createdByAdminId")
  values(p_page_id,v_hash,v_expires,v_admin->>'id')
  returning id into v_id;
  return jsonb_build_object('id',v_id,'token',v_raw,'expiresAt',v_expires);
end
$function$;

create or replace function public.admin_builder_preview_list(p_token text, p_page_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
stable
as $function$
declare
  v_admin jsonb;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if coalesce(v_admin->>'role','') not in ('SUPER_ADMIN','EDITOR') then raise exception 'forbidden'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',id,
      'expiresAt',"expiresAt",
      'createdAt',"createdAt",
      'revokedAt',"revokedAt",
      'active',("revokedAt" is null and "expiresAt">now())
    ) order by "createdAt" desc)
    from public."BuilderPreviewToken"
    where "pageId"=p_page_id
  ),'[]'::jsonb);
end
$function$;

create or replace function public.admin_builder_preview_revoke(p_token text, p_preview_id text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_admin jsonb;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if coalesce(v_admin->>'role','') not in ('SUPER_ADMIN','EDITOR') then raise exception 'forbidden'; end if;
  update public."BuilderPreviewToken" set "revokedAt"=coalesce("revokedAt",now()) where id=p_preview_id;
  return found;
end
$function$;

create or replace function public.public_builder_preview(p_preview_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
stable
as $function$
declare
  v_hash text;
  v_result jsonb;
begin
  if p_preview_token is null or length(p_preview_token)<>64 or p_preview_token !~ '^[0-9a-f]{64}$' then return null; end if;
  v_hash := encode(digest(p_preview_token,'sha256'),'hex');
  select jsonb_build_object(
    'page',jsonb_build_object(
      'id',p.id,'slug',p.slug,
      'titleFa',p."titleFa",'titleTr',p."titleTr",'titleEn',p."titleEn",'titleAr',p."titleAr",
      'template',p.template
    ),
    'document',d.draft,
    'expiresAt',t."expiresAt"
  ) into v_result
  from public."BuilderPreviewToken" t
  join public."Page" p on p.id=t."pageId"
  join public."PageBuilderDocument" d on d."pageId"=p.id
  where t."tokenHash"=v_hash and t."revokedAt" is null and t."expiresAt">now()
  limit 1;
  return v_result;
end
$function$;

create or replace function public.admin_builder_templates(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
stable
as $function$
declare
  v_admin jsonb;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if coalesce(v_admin->>'role','') not in ('SUPER_ADMIN','EDITOR') then raise exception 'forbidden'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',id,'name',name,'description',description,'document',document,
      'createdAt',"createdAt",'updatedAt',"updatedAt"
    ) order by "updatedAt" desc)
    from public."BuilderTemplateLibrary"
  ),'[]'::jsonb);
end
$function$;

create or replace function public.admin_builder_template_save(
  p_token text,
  p_id text,
  p_name text,
  p_description text,
  p_document jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_admin jsonb;
  v_row public."BuilderTemplateLibrary"%rowtype;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if coalesce(v_admin->>'role','') not in ('SUPER_ADMIN','EDITOR') then raise exception 'forbidden'; end if;
  if length(trim(coalesce(p_name,'')))<2 or length(trim(p_name))>120 then raise exception 'invalid_name'; end if;
  if jsonb_typeof(p_document)<>'object' or jsonb_typeof(coalesce(p_document->'sections','[]'::jsonb))<>'array' then raise exception 'invalid_document'; end if;
  if jsonb_array_length(coalesce(p_document->'sections','[]'::jsonb))>100 then raise exception 'too_many_sections'; end if;

  if nullif(trim(coalesce(p_id,'')),'') is null then
    insert into public."BuilderTemplateLibrary"(name,description,document,"createdByAdminId","updatedByAdminId")
    values(trim(p_name),left(coalesce(p_description,''),500),p_document,v_admin->>'id',v_admin->>'id')
    returning * into v_row;
  else
    update public."BuilderTemplateLibrary"
    set name=trim(p_name),description=left(coalesce(p_description,''),500),document=p_document,
        "updatedByAdminId"=v_admin->>'id',"updatedAt"=now()
    where id=p_id
    returning * into v_row;
    if v_row.id is null then raise exception 'template_not_found'; end if;
  end if;
  return jsonb_build_object('id',v_row.id,'name',v_row.name,'description',v_row.description,'document',v_row.document,'updatedAt',v_row."updatedAt");
end
$function$;

create or replace function public.admin_builder_template_delete(p_token text, p_id text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_admin jsonb;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if coalesce(v_admin->>'role','') not in ('SUPER_ADMIN','EDITOR') then raise exception 'forbidden'; end if;
  delete from public."BuilderTemplateLibrary" where id=p_id;
  return found;
end
$function$;

create or replace function public.admin_builder_template_apply(p_token text, p_page_id text, p_template_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_admin jsonb;
  v_document jsonb;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if coalesce(v_admin->>'role','') not in ('SUPER_ADMIN','EDITOR') then raise exception 'forbidden'; end if;
  if not exists(select 1 from public."Page" where id=p_page_id) then raise exception 'page_not_found'; end if;
  select document into v_document from public."BuilderTemplateLibrary" where id=p_template_id;
  if v_document is null then raise exception 'template_not_found'; end if;
  insert into public."PageBuilderDocument"("pageId",draft,"draftUpdatedAt","updatedAt")
  values(p_page_id,v_document,now(),now())
  on conflict("pageId") do update set draft=excluded.draft,"draftUpdatedAt"=now(),"updatedAt"=now();
  return v_document;
end
$function$;

revoke all on function public.admin_builder_preview_create(text,text,integer) from public, authenticated;
revoke all on function public.admin_builder_preview_list(text,text) from public, authenticated;
revoke all on function public.admin_builder_preview_revoke(text,text) from public, authenticated;
revoke all on function public.admin_builder_templates(text) from public, authenticated;
revoke all on function public.admin_builder_template_save(text,text,text,text,jsonb) from public, authenticated;
revoke all on function public.admin_builder_template_delete(text,text) from public, authenticated;
revoke all on function public.admin_builder_template_apply(text,text,text) from public, authenticated;
grant execute on function public.admin_builder_preview_create(text,text,integer) to anon, service_role;
grant execute on function public.admin_builder_preview_list(text,text) to anon, service_role;
grant execute on function public.admin_builder_preview_revoke(text,text) to anon, service_role;
grant execute on function public.admin_builder_templates(text) to anon, service_role;
grant execute on function public.admin_builder_template_save(text,text,text,text,jsonb) to anon, service_role;
grant execute on function public.admin_builder_template_delete(text,text) to anon, service_role;
grant execute on function public.admin_builder_template_apply(text,text,text) to anon, service_role;

revoke all on function public.public_builder_preview(text) from public, authenticated;
grant execute on function public.public_builder_preview(text) to anon, service_role;
