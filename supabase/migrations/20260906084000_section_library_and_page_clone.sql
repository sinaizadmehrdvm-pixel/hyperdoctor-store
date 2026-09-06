-- Versions 238–239 — reusable section library + safe page cloning
-- Additive only. This migration creates no section presets and clones no pages by itself.

create table if not exists public."BuilderSectionLibrary" (
  id text primary key default replace(gen_random_uuid()::text,'-',''),
  name text not null,
  description text not null default '',
  section jsonb not null,
  "createdByAdminId" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "BuilderSectionLibrary_updatedAt_idx"
  on public."BuilderSectionLibrary"("updatedAt" desc);

alter table public."BuilderSectionLibrary" enable row level security;

create or replace function public.admin_builder_sections(p_token text, p_search text default '')
returns jsonb
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

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',s.id,
      'name',s.name,
      'description',s.description,
      'section',s.section,
      'createdAt',s."createdAt",
      'updatedAt',s."updatedAt"
    ) order by s."updatedAt" desc)
    from public."BuilderSectionLibrary" s
    where nullif(trim(coalesce(p_search,'')),'') is null
       or s.name ilike '%'||trim(p_search)||'%'
       or s.description ilike '%'||trim(p_search)||'%'
       or coalesce(s.section->>'type','') ilike '%'||trim(p_search)||'%'
  ), '[]'::jsonb);
end
$function$;

create or replace function public.admin_builder_section_save(
  p_token text,
  p_id text,
  p_name text,
  p_description text,
  p_section jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_admin jsonb;
  v_id text;
  v_row public."BuilderSectionLibrary"%rowtype;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if coalesce(v_admin->>'role','') not in ('SUPER_ADMIN','EDITOR') then raise exception 'forbidden'; end if;
  if length(trim(coalesce(p_name,''))) < 2 or length(trim(p_name)) > 120 then raise exception 'invalid_name'; end if;
  if jsonb_typeof(p_section) <> 'object' then raise exception 'invalid_section'; end if;
  if coalesce(p_section->>'type','') not in ('hero','richText','imageText','cards','cta','spacer') then raise exception 'invalid_section_type'; end if;
  if nullif(trim(coalesce(p_section->>'id','')),'') is null then raise exception 'missing_section_id'; end if;
  if jsonb_typeof(coalesce(p_section->'content','{}'::jsonb)) <> 'object' then raise exception 'invalid_section_content'; end if;
  if jsonb_typeof(coalesce(p_section->'settings','{}'::jsonb)) <> 'object' then raise exception 'invalid_section_settings'; end if;
  if pg_column_size(p_section) > 524288 then raise exception 'section_too_large'; end if;

  v_id := nullif(trim(coalesce(p_id,'')),'');
  if v_id is null then
    insert into public."BuilderSectionLibrary"(name,description,section,"createdByAdminId")
    values(trim(p_name),left(coalesce(p_description,''),500),p_section,v_admin->>'id')
    returning * into v_row;
  else
    update public."BuilderSectionLibrary"
      set name=trim(p_name), description=left(coalesce(p_description,''),500), section=p_section, "updatedAt"=now()
      where id=v_id
      returning * into v_row;
    if v_row.id is null then raise exception 'section_preset_not_found'; end if;
  end if;

  return jsonb_build_object(
    'id',v_row.id,'name',v_row.name,'description',v_row.description,'section',v_row.section,
    'createdAt',v_row."createdAt",'updatedAt',v_row."updatedAt"
  );
end
$function$;

create or replace function public.admin_builder_section_delete(p_token text, p_id text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_admin jsonb;
  v_count integer;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if coalesce(v_admin->>'role','') not in ('SUPER_ADMIN','EDITOR') then raise exception 'forbidden'; end if;
  delete from public."BuilderSectionLibrary" where id=p_id;
  get diagnostics v_count = row_count;
  return v_count > 0;
end
$function$;

create or replace function public.admin_page_clone(p_token text, p_page_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_admin jsonb;
  v_source public."Page"%rowtype;
  v_doc public."PageBuilderDocument"%rowtype;
  v_new_id text;
  v_base_slug text;
  v_slug text;
  v_suffix integer := 1;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if coalesce(v_admin->>'role','') not in ('SUPER_ADMIN','EDITOR') then raise exception 'forbidden'; end if;

  select * into v_source from public."Page" where id=p_page_id;
  if v_source.id is null then raise exception 'page_not_found'; end if;

  v_new_id := replace(gen_random_uuid()::text,'-','');
  v_base_slug := left(regexp_replace(lower(v_source.slug || '-copy'), '[^a-z0-9-]+', '-', 'g'), 100);
  v_base_slug := trim(both '-' from v_base_slug);
  if v_base_slug = '' then v_base_slug := 'page-copy'; end if;
  v_slug := v_base_slug;

  while exists(select 1 from public."Page" where slug=v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := left(v_base_slug, 92) || '-' || v_suffix::text;
  end loop;

  insert into public."Page"(
    id,slug,"titleFa","titleTr","titleEn","titleAr",
    "contentFa","contentTr","contentEn","contentAr",template,
    "isPublished","showInNav","navOrder","createdAt","updatedAt"
  ) values (
    v_new_id,v_slug,
    v_source."titleFa" || ' — کپی',
    v_source."titleTr" || ' — Kopya',
    v_source."titleEn" || ' — Copy',
    v_source."titleAr" || ' — نسخة',
    v_source."contentFa",v_source."contentTr",v_source."contentEn",v_source."contentAr",v_source.template,
    false,false,0,now(),now()
  );

  select * into v_doc from public."PageBuilderDocument" where "pageId"=p_page_id;
  if v_doc."pageId" is not null then
    insert into public."PageBuilderDocument"(
      "pageId",draft,published,"draftUpdatedAt","publishedAt","publishedRevision","createdAt","updatedAt"
    ) values (
      v_new_id,v_doc.draft,null,now(),null,0,now(),now()
    );
  end if;

  return jsonb_build_object('id',v_new_id,'slug',v_slug,'isPublished',false,'showInNav',false);
end
$function$;

revoke all on function public.admin_builder_sections(text,text) from public, authenticated;
revoke all on function public.admin_builder_section_save(text,text,text,text,jsonb) from public, authenticated;
revoke all on function public.admin_builder_section_delete(text,text) from public, authenticated;
revoke all on function public.admin_page_clone(text,text) from public, authenticated;

grant execute on function public.admin_builder_sections(text,text) to anon, service_role;
grant execute on function public.admin_builder_section_save(text,text,text,text,jsonb) to anon, service_role;
grant execute on function public.admin_builder_section_delete(text,text) to anon, service_role;
grant execute on function public.admin_page_clone(text,text) to anon, service_role;
