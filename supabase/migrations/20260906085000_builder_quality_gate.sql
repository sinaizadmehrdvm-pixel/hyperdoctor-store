-- Version 240 — deterministic pre-publish quality/accessibility gate.
-- Existing valid drafts remain publishable. Only malformed or unsafe documents are blocked.

create or replace function public.builder_document_quality(p_document jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public, extensions
as $function$
declare
  v_errors jsonb := '[]'::jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_section jsonb;
  v_index integer := 0;
  v_id text;
  v_type text;
  v_content jsonb;
  v_settings jsonb;
  v_href text;
  v_image text;
  v_hidden jsonb;
  v_missing text[];
  v_locale text;
  v_title jsonb;
  v_alt jsonb;
  v_dupes jsonb;
begin
  if jsonb_typeof(p_document) <> 'object' then
    return jsonb_build_object('blocking',true,'errors',jsonb_build_array(jsonb_build_object('code','invalid_document','message','Builder document must be an object.')),'warnings','[]'::jsonb);
  end if;
  if jsonb_typeof(coalesce(p_document->'sections','[]'::jsonb)) <> 'array' then
    return jsonb_build_object('blocking',true,'errors',jsonb_build_array(jsonb_build_object('code','invalid_sections','message','Sections must be an array.')),'warnings','[]'::jsonb);
  end if;
  if jsonb_array_length(coalesce(p_document->'sections','[]'::jsonb)) > 100 then
    v_errors := v_errors || jsonb_build_array(jsonb_build_object('code','too_many_sections','message','A page cannot contain more than 100 sections.'));
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id',id,'count',cnt)),'[]'::jsonb) into v_dupes
  from (
    select e->>'id' id,count(*) cnt
    from jsonb_array_elements(coalesce(p_document->'sections','[]'::jsonb)) e
    where nullif(trim(coalesce(e->>'id','')),'') is not null
    group by e->>'id' having count(*) > 1
  ) d;
  if jsonb_array_length(v_dupes)>0 then
    v_errors := v_errors || jsonb_build_array(jsonb_build_object('code','duplicate_section_ids','message','Section IDs must be unique.','details',v_dupes));
  end if;

  for v_section in select value from jsonb_array_elements(coalesce(p_document->'sections','[]'::jsonb)) loop
    v_index := v_index + 1;
    v_id := trim(coalesce(v_section->>'id',''));
    v_type := coalesce(v_section->>'type','');
    v_content := coalesce(v_section->'content','{}'::jsonb);
    v_settings := coalesce(v_section->'settings','{}'::jsonb);

    if v_id='' then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('code','missing_section_id','sectionIndex',v_index,'message','A section is missing its ID.'));
    end if;
    if v_type not in ('hero','richText','imageText','cards','cta','spacer') then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('code','invalid_section_type','sectionId',v_id,'message','Unsupported section type.'));
      continue;
    end if;
    if jsonb_typeof(v_content)<>'object' or jsonb_typeof(v_settings)<>'object' then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('code','invalid_section_shape','sectionId',v_id,'message','Section content/settings must be objects.'));
      continue;
    end if;

    v_hidden := coalesce(v_settings->'hiddenOn','[]'::jsonb);
    if jsonb_typeof(v_hidden)='array' and v_hidden @> '["desktop","tablet","mobile"]'::jsonb then
      v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','hidden_everywhere','sectionId',v_id,'message','This section is hidden on desktop, tablet and mobile.'));
    end if;

    if v_type in ('hero','cta','imageText','cards') then
      v_title := coalesce(v_content->'title','{}'::jsonb);
      v_missing := array[]::text[];
      foreach v_locale in array array['fa','tr','en','ar'] loop
        if trim(coalesce(v_title->>v_locale,''))='' then v_missing := array_append(v_missing,v_locale); end if;
      end loop;
      if array_length(v_missing,1) is not null then
        v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','missing_title_locales','sectionId',v_id,'locales',to_jsonb(v_missing),'message','Title is missing in one or more languages.'));
      end if;
    end if;

    v_href := trim(coalesce(v_content->>'buttonHref',''));
    if lower(v_href) ~ '^(javascript|data|vbscript):' then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('code','unsafe_link','sectionId',v_id,'message','Executable URL schemes are not allowed.'));
    elsif lower(v_href) ~ '^http://' then
      v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','insecure_link','sectionId',v_id,'message','Use HTTPS for external links.'));
    end if;

    if v_type='imageText' then
      v_image := trim(coalesce(v_content->>'imageUrl',''));
      if lower(v_image) ~ '^(javascript|data|vbscript):' then
        v_errors := v_errors || jsonb_build_array(jsonb_build_object('code','unsafe_image_url','sectionId',v_id,'message','Unsafe image URL scheme.'));
      elsif lower(v_image) ~ '^http://' then
        v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','insecure_image','sectionId',v_id,'message','Use HTTPS for external images.'));
      end if;
      if v_image<>'' then
        v_alt := coalesce(v_content->'imageAlt','{}'::jsonb);
        v_missing := array[]::text[];
        foreach v_locale in array array['fa','tr','en','ar'] loop
          if trim(coalesce(v_alt->>v_locale,''))='' then v_missing := array_append(v_missing,v_locale); end if;
        end loop;
        if array_length(v_missing,1) is not null then
          v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','missing_image_alt','sectionId',v_id,'locales',to_jsonb(v_missing),'message','Image alt text is missing in one or more languages.'));
        end if;
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'blocking',jsonb_array_length(v_errors)>0,
    'errors',v_errors,
    'warnings',v_warnings,
    'errorCount',jsonb_array_length(v_errors),
    'warningCount',jsonb_array_length(v_warnings),
    'sectionCount',jsonb_array_length(coalesce(p_document->'sections','[]'::jsonb))
  );
end
$function$;

create or replace function public.admin_builder_quality(p_token text, p_document jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;
  return public.builder_document_quality(p_document);
end
$function$;

create or replace function public.admin_page_builder_quality(p_token text, p_page_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_document jsonb;
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;
  select draft into v_document from public."PageBuilderDocument" where "pageId"=p_page_id;
  if v_document is null then raise exception 'draft_not_found'; end if;
  return public.builder_document_quality(v_document);
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
  v_quality jsonb;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;

  select * into v_doc from public."PageBuilderDocument" where "pageId"=p_page_id for update;
  if v_doc."pageId" is null then raise exception 'draft_not_found'; end if;

  v_quality := public.builder_document_quality(v_doc.draft);
  if coalesce((v_quality->>'blocking')::boolean,false) then
    raise exception 'builder_quality_blocked:%', v_quality::text;
  end if;

  v_revision := v_doc."publishedRevision" + 1;
  insert into public."PageBuilderRevision"("pageId",revision,document,"createdByAdminId")
  values(p_page_id,v_revision,v_doc.draft,v_admin->>'id');
  update public."PageBuilderDocument"
    set published=draft,"publishedAt"=now(),"publishedRevision"=v_revision,"updatedAt"=now()
    where "pageId"=p_page_id;

  return jsonb_build_object('published',v_doc.draft,'publishedRevision',v_revision,'publishedAt',now(),'quality',v_quality);
end
$function$;

revoke all on function public.builder_document_quality(jsonb) from public, anon, authenticated;
revoke all on function public.admin_builder_quality(text,jsonb) from public, authenticated;
revoke all on function public.admin_page_builder_quality(text,text) from public, authenticated;
grant execute on function public.admin_builder_quality(text,jsonb) to anon, service_role;
grant execute on function public.admin_page_builder_quality(text,text) to anon, service_role;
