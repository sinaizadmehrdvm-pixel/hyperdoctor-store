-- Version 238 — insert a reusable section into a page draft without publishing.

create or replace function public.admin_builder_section_apply(p_token text, p_page_id text, p_section_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_admin jsonb;
  v_section jsonb;
  v_new_section jsonb;
  v_page public."Page"%rowtype;
  v_doc public."PageBuilderDocument"%rowtype;
  v_draft jsonb;
  v_legacy jsonb;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if coalesce(v_admin->>'role','') not in ('SUPER_ADMIN','EDITOR') then raise exception 'forbidden'; end if;

  select * into v_page from public."Page" where id=p_page_id;
  if v_page.id is null then raise exception 'page_not_found'; end if;
  select section into v_section from public."BuilderSectionLibrary" where id=p_section_id;
  if v_section is null then raise exception 'section_preset_not_found'; end if;

  v_new_section := jsonb_set(
    v_section,
    '{id}',
    to_jsonb(coalesce(v_section->>'type','section') || '-' || replace(gen_random_uuid()::text,'-','')),
    true
  );

  select * into v_doc from public."PageBuilderDocument" where "pageId"=p_page_id for update;
  if v_doc."pageId" is null then
    v_legacy := jsonb_build_object(
      'id','legacy-content',
      'type','richText',
      'visible',true,
      'content',jsonb_build_object('text',jsonb_build_object(
        'fa',coalesce(v_page."contentFa",''),
        'tr',coalesce(v_page."contentTr",''),
        'en',coalesce(v_page."contentEn",''),
        'ar',coalesce(v_page."contentAr",'')
      )),
      'settings',jsonb_build_object('maxWidth','960','paddingY','64','background','#ffffff')
    );
    v_draft := jsonb_build_object('version',1,'sections',jsonb_build_array(v_legacy,v_new_section));
    insert into public."PageBuilderDocument"("pageId",draft,"draftUpdatedAt","createdAt","updatedAt")
    values(p_page_id,v_draft,now(),now(),now());
  else
    if jsonb_array_length(coalesce(v_doc.draft->'sections','[]'::jsonb)) >= 100 then raise exception 'too_many_sections'; end if;
    v_draft := jsonb_set(
      v_doc.draft,
      '{sections}',
      coalesce(v_doc.draft->'sections','[]'::jsonb) || jsonb_build_array(v_new_section),
      true
    );
    update public."PageBuilderDocument"
      set draft=v_draft,"draftUpdatedAt"=now(),"updatedAt"=now()
      where "pageId"=p_page_id;
  end if;

  return jsonb_build_object('draft',v_draft,'insertedSectionId',v_new_section->>'id');
end
$function$;

revoke all on function public.admin_builder_section_apply(text,text,text) from public, authenticated;
grant execute on function public.admin_builder_section_apply(text,text,text) to anon, service_role;
