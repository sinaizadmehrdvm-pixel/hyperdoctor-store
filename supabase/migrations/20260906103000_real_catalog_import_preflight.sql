-- Version 247: real catalog launch preflight and product identity guards

create unique index if not exists product_sku_lower_unique
  on public."Product" (lower(btrim(sku)))
  where btrim(sku) <> '';

create unique index if not exists product_slug_lower_unique
  on public."Product" (lower(btrim(slug)))
  where btrim(slug) <> '';

create or replace function public.admin_product_import_preflight(
  p_token text,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_item jsonb;
  v_index integer;
  v_sku text;
  v_category_slug text;
  v_name_en text;
  v_slug text;
  v_price bigint;
  v_stock bigint;
  v_is_published boolean;
  v_image_count integer;
  v_existing_id text;
  v_existing_slug_owner text;
  v_category_exists boolean;
  v_duplicate_count integer;
  v_errors jsonb;
  v_warnings jsonb;
  v_rows jsonb := '[]'::jsonb;
  v_error_rows integer := 0;
  v_warning_rows integer := 0;
  v_create_rows integer := 0;
  v_update_rows integer := 0;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then
    raise exception 'forbidden';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'p_rows must be a JSON array';
  end if;
  if jsonb_array_length(p_rows) > 2000 then
    raise exception 'import row limit is 2000 products';
  end if;

  for v_item, v_index in
    select value, ordinality::integer
    from jsonb_array_elements(p_rows) with ordinality
  loop
    v_errors := '[]'::jsonb;
    v_warnings := '[]'::jsonb;
    v_sku := btrim(coalesce(v_item->>'sku', ''));
    v_category_slug := btrim(coalesce(v_item->>'categorySlug', ''));
    v_name_en := btrim(coalesce(v_item->>'nameEn', ''));
    v_slug := btrim(coalesce(v_item->>'slug', ''));
    if v_slug = '' and v_name_en <> '' then
      v_slug := lower(regexp_replace(v_name_en, '[^a-zA-Z0-9]+', '-', 'g'));
      v_slug := btrim(v_slug, '-');
    end if;

    begin
      v_price := coalesce(nullif(btrim(v_item->>'price'), ''), '0')::bigint;
    exception when others then
      v_price := 0;
      v_errors := v_errors || jsonb_build_array('invalid_price');
    end;
    begin
      v_stock := coalesce(nullif(btrim(v_item->>'stock'), ''), '0')::bigint;
    exception when others then
      v_stock := 0;
      v_errors := v_errors || jsonb_build_array('invalid_stock');
    end;
    begin
      v_is_published := coalesce((v_item->>'isPublished')::boolean, false);
    exception when others then
      v_is_published := false;
      v_errors := v_errors || jsonb_build_array('invalid_publish_flag');
    end;

    v_image_count := case
      when jsonb_typeof(v_item->'imageUrls') = 'array' then jsonb_array_length(v_item->'imageUrls')
      else 0
    end;

    if v_sku = '' then v_errors := v_errors || jsonb_build_array('missing_sku'); end if;
    if v_category_slug = '' then v_errors := v_errors || jsonb_build_array('missing_category'); end if;
    if btrim(coalesce(v_item->>'nameFa','')) = '' then v_errors := v_errors || jsonb_build_array('missing_name_fa'); end if;
    if btrim(coalesce(v_item->>'nameTr','')) = '' then v_errors := v_errors || jsonb_build_array('missing_name_tr'); end if;
    if v_name_en = '' then v_errors := v_errors || jsonb_build_array('missing_name_en'); end if;
    if btrim(coalesce(v_item->>'nameAr','')) = '' then v_errors := v_errors || jsonb_build_array('missing_name_ar'); end if;
    if v_slug = '' then v_errors := v_errors || jsonb_build_array('missing_slug'); end if;

    select exists(select 1 from public."Category" where slug = v_category_slug)
      into v_category_exists;
    if v_category_slug <> '' and not v_category_exists then
      v_errors := v_errors || jsonb_build_array('unknown_category');
    end if;

    if v_sku <> '' then
      select count(*) into v_duplicate_count
      from jsonb_array_elements(p_rows) x
      where lower(btrim(coalesce(x->>'sku',''))) = lower(v_sku);
      if v_duplicate_count > 1 then
        v_errors := v_errors || jsonb_build_array('duplicate_sku_in_file');
      end if;
    end if;

    select id into v_existing_id
    from public."Product"
    where lower(btrim(sku)) = lower(v_sku)
    limit 1;

    if v_slug <> '' then
      select id into v_existing_slug_owner
      from public."Product"
      where lower(btrim(slug)) = lower(v_slug)
      limit 1;
      if v_existing_slug_owner is not null
         and (v_existing_id is null or v_existing_slug_owner <> v_existing_id) then
        v_errors := v_errors || jsonb_build_array('slug_conflict');
      end if;
    end if;

    if v_price <= 0 then v_warnings := v_warnings || jsonb_build_array('missing_price'); end if;
    if v_image_count = 0 then v_warnings := v_warnings || jsonb_build_array('missing_image'); end if;
    if v_stock <= 0 then v_warnings := v_warnings || jsonb_build_array('out_of_stock'); end if;

    if v_is_published and v_price <= 0 then
      v_errors := v_errors || jsonb_build_array('publish_requires_price');
    end if;
    if v_is_published and v_image_count = 0 then
      v_errors := v_errors || jsonb_build_array('publish_requires_image');
    end if;

    if jsonb_array_length(v_errors) > 0 then
      v_error_rows := v_error_rows + 1;
    elsif v_existing_id is null then
      v_create_rows := v_create_rows + 1;
    else
      v_update_rows := v_update_rows + 1;
    end if;
    if jsonb_array_length(v_warnings) > 0 then
      v_warning_rows := v_warning_rows + 1;
    end if;

    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'line', v_index + 1,
      'sku', v_sku,
      'slug', v_slug,
      'action', case when v_existing_id is null then 'create' else 'update' end,
      'existingProductId', v_existing_id,
      'errors', v_errors,
      'warnings', v_warnings
    ));
  end loop;

  return jsonb_build_object(
    'total', jsonb_array_length(p_rows),
    'create', v_create_rows,
    'update', v_update_rows,
    'errorRows', v_error_rows,
    'warningRows', v_warning_rows,
    'canApply', v_error_rows = 0,
    'rows', v_rows
  );
end
$function$;

revoke all on function public.admin_product_import_preflight(text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_product_import_preflight(text, jsonb) to service_role;
