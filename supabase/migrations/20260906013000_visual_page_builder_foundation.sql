-- Version 226 — Visual Page Builder Foundation
-- Additive, backward-compatible persistence for Lovable-style page editing.

create table if not exists public."PageBuilderDocument" (
  "pageId" text primary key references public."Page"(id) on delete cascade,
  draft jsonb not null default '{"version":1,"sections":[]}'::jsonb,
  published jsonb,
  "draftUpdatedAt" timestamptz not null default now(),
  "publishedAt" timestamptz,
  "publishedRevision" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public."PageBuilderRevision" (
  id text primary key default replace(gen_random_uuid()::text,'-',''),
  "pageId" text not null references public."Page"(id) on delete cascade,
  revision integer not null,
  document jsonb not null,
  "createdByAdminId" text,
  "createdAt" timestamptz not null default now(),
  unique ("pageId", revision)
);

create index if not exists "PageBuilderRevision_pageId_createdAt_idx"
  on public."PageBuilderRevision"("pageId", "createdAt" desc);

alter table public."PageBuilderDocument" enable row level security;
alter table public."PageBuilderRevision" enable row level security;

create or replace function public.admin_page_builder_get(p_token text, p_page_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_page jsonb;
  v_doc public."PageBuilderDocument"%rowtype;
  v_legacy jsonb;
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;

  select to_jsonb(p) into v_page from public."Page" p where p.id=p_page_id limit 1;
  if v_page is null then return null; end if;

  select * into v_doc from public."PageBuilderDocument" where "pageId"=p_page_id;

  if v_doc."pageId" is null then
    v_legacy := jsonb_build_object(
      'version',1,
      'sections',jsonb_build_array(jsonb_build_object(
        'id','legacy-content',
        'type','richText',
        'visible',true,
        'content',jsonb_build_object(
          'fa',coalesce(v_page->>'contentFa',''),
          'tr',coalesce(v_page->>'contentTr',''),
          'en',coalesce(v_page->>'contentEn',''),
          'ar',coalesce(v_page->>'contentAr','')
        ),
        'settings',jsonb_build_object('maxWidth','960','paddingY','64','background','#ffffff')
      ))
    );
    return jsonb_build_object(
      'page', v_page,
      'draft', v_legacy,
      'published', null,
      'publishedRevision', 0,
      'revisions', '[]'::jsonb
    );
  end if;

  return jsonb_build_object(
    'page', v_page,
    'draft', v_doc.draft,
    'published', v_doc.published,
    'draftUpdatedAt', v_doc."draftUpdatedAt",
    'publishedAt', v_doc."publishedAt",
    'publishedRevision', v_doc."publishedRevision",
    'revisions', coalesce((
      select jsonb_agg(x order by (x->>'revision')::int desc)
      from (
        select jsonb_build_object('revision',r.revision,'createdAt',r."createdAt") x
        from public."PageBuilderRevision" r
        where r."pageId"=p_page_id
        order by r.revision desc
        limit 20
      ) q
    ), '[]'::jsonb)
  );
end
$function$;

create or replace function public.admin_page_builder_save(p_token text, p_page_id text, p_document jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_saved public."PageBuilderDocument"%rowtype;
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;
  if not exists(select 1 from public."Page" where id=p_page_id) then raise exception 'page_not_found'; end if;
  if jsonb_typeof(p_document) <> 'object' then raise exception 'invalid_document'; end if;
  if jsonb_typeof(coalesce(p_document->'sections','[]'::jsonb)) <> 'array' then raise exception 'invalid_sections'; end if;
  if jsonb_array_length(coalesce(p_document->'sections','[]'::jsonb)) > 100 then raise exception 'too_many_sections'; end if;

  insert into public."PageBuilderDocument"("pageId",draft,"draftUpdatedAt","updatedAt")
  values(p_page_id,p_document,now(),now())
  on conflict("pageId") do update set
    draft=excluded.draft,
    "draftUpdatedAt"=now(),
    "updatedAt"=now()
  returning * into v_saved;

  return jsonb_build_object(
    'draft',v_saved.draft,
    'draftUpdatedAt',v_saved."draftUpdatedAt",
    'publishedRevision',v_saved."publishedRevision"
  );
end
$function$;

create or replace function public.admin_page_builder_publish(p_token text, p_page_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_admin jsonb;
  v_doc public."PageBuilderDocument"%rowtype;
  v_revision integer;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;

  select * into v_doc from public."PageBuilderDocument" where "pageId"=p_page_id for update;
  if v_doc."pageId" is null then raise exception 'draft_not_found'; end if;

  v_revision := v_doc."publishedRevision" + 1;

  insert into public."PageBuilderRevision"("pageId",revision,document,"createdByAdminId")
  values(p_page_id,v_revision,v_doc.draft,v_admin->>'id');

  update public."PageBuilderDocument"
  set published=draft,
      "publishedAt"=now(),
      "publishedRevision"=v_revision,
      "updatedAt"=now()
  where "pageId"=p_page_id;

  return jsonb_build_object('published',v_doc.draft,'publishedRevision',v_revision,'publishedAt',now());
end
$function$;

create or replace function public.admin_page_builder_restore(p_token text, p_page_id text, p_revision integer)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_document jsonb;
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;
  select document into v_document from public."PageBuilderRevision"
  where "pageId"=p_page_id and revision=p_revision;
  if v_document is null then raise exception 'revision_not_found'; end if;

  insert into public."PageBuilderDocument"("pageId",draft,"draftUpdatedAt","updatedAt")
  values(p_page_id,v_document,now(),now())
  on conflict("pageId") do update set draft=excluded.draft,"draftUpdatedAt"=now(),"updatedAt"=now();

  return v_document;
end
$function$;

create or replace function public.public_page_builder(p_slug text)
returns jsonb
language sql
security definer
set search_path = public, extensions
stable
as $function$
  select case when d.published is null then null else jsonb_build_object(
    'page', jsonb_build_object(
      'id',p.id,'slug',p.slug,
      'titleFa',p."titleFa",'titleTr',p."titleTr",'titleEn',p."titleEn",'titleAr',p."titleAr",
      'template',p.template
    ),
    'document',d.published,
    'publishedAt',d."publishedAt",
    'revision',d."publishedRevision"
  ) end
  from public."Page" p
  left join public."PageBuilderDocument" d on d."pageId"=p.id
  where p.slug=lower(trim(p_slug)) and p."isPublished"=true
  limit 1
$function$;

revoke all on function public.admin_page_builder_get(text,text) from public, authenticated;
revoke all on function public.admin_page_builder_save(text,text,jsonb) from public, authenticated;
revoke all on function public.admin_page_builder_publish(text,text) from public, authenticated;
revoke all on function public.admin_page_builder_restore(text,text,integer) from public, authenticated;
grant execute on function public.admin_page_builder_get(text,text) to anon, service_role;
grant execute on function public.admin_page_builder_save(text,text,jsonb) to anon, service_role;
grant execute on function public.admin_page_builder_publish(text,text) to anon, service_role;
grant execute on function public.admin_page_builder_restore(text,text,integer) to anon, service_role;

revoke all on function public.public_page_builder(text) from public, authenticated;
grant execute on function public.public_page_builder(text) to anon, service_role;
