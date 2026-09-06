alter table public."CatalogStagingItem"
  add column if not exists "siteSku" text not null default '',
  add column if not exists "identityStatus" text not null default 'UNRESOLVED';

alter table public."CatalogStagingItem"
  drop constraint if exists "CatalogStagingItem_identityStatus_check";
alter table public."CatalogStagingItem"
  add constraint "CatalogStagingItem_identityStatus_check"
  check ("identityStatus" in ('UNRESOLVED','VERIFIED'));

create unique index if not exists "CatalogStagingItem_siteSku_verified_uq"
  on public."CatalogStagingItem" (lower(btrim("siteSku")))
  where "identityStatus"='VERIFIED' and btrim("siteSku")<>'' and status<>'REJECTED';

create or replace function public.admin_catalog_staging_put_item(p_token text, p_batch_id text, p_item jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_batch public."CatalogStagingBatch"%rowtype;
  v_category public."Category"%rowtype;
  v_existing_id text;
  v_conflict_id text;
  v_errors jsonb := '[]'::jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_payload jsonb := coalesce(p_item->'payload','{}'::jsonb);
  v_images jsonb := coalesce(p_item->'images','[]'::jsonb);
  v_evidence jsonb := coalesce(p_item->'evidence','{}'::jsonb);
  v_row integer := greatest(coalesce((p_item->>'rowNumber')::integer,1),1);
  v_source_sku text := btrim(coalesce(p_item->>'sourceSku',v_payload->>'sku',''));
  v_source_model text := btrim(coalesce(p_item->>'sourceModel',v_payload->>'modelNumber',''));
  v_site_sku text := btrim(coalesce(p_item->>'siteSku',''));
  v_slug text := btrim(coalesce(v_payload->>'slug',''));
  v_category_slug text := btrim(coalesce(v_payload->>'categorySlug',p_item->>'categorySlug',''));
  v_status text;
  v_result public."CatalogStagingItem"%rowtype;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_batch from public."CatalogStagingBatch" where id=p_batch_id and status in ('DRAFT','IN_REVIEW');
  if not found then raise exception 'editable staging batch not found'; end if;

  if v_source_sku='' and v_source_model='' then v_errors:=v_errors||'"missing_source_identity"'::jsonb; end if;
  if v_site_sku='' then
    v_errors:=v_errors||'"site_sku_unverified"'::jsonb;
    v_payload:=v_payload-'sku';
  else
    if v_site_sku ~ '[[:space:]]' or length(v_site_sku)>100 then v_errors:=v_errors||'"invalid_site_sku"'::jsonb; end if;
    select id into v_existing_id from public."Product" where lower(btrim(sku))=lower(v_site_sku) limit 1;
    select id into v_conflict_id from public."CatalogStagingItem"
      where "batchId"=p_batch_id and "rowNumber"<>v_row and "identityStatus"='VERIFIED'
        and status<>'REJECTED' and lower(btrim("siteSku"))=lower(v_site_sku) limit 1;
    if v_conflict_id is not null then v_errors:=v_errors||'"site_sku_staging_conflict"'::jsonb; end if;
    v_payload:=jsonb_set(v_payload,'{sku}',to_jsonb(v_site_sku),true);
  end if;

  if v_category_slug='' then v_errors:=v_errors||'"missing_category"'::jsonb;
  else select * into v_category from public."Category" where slug=v_category_slug limit 1;
    if not found then v_errors:=v_errors||'"unknown_category"'::jsonb; end if;
  end if;
  if btrim(coalesce(v_payload->>'nameFa',''))='' then v_errors:=v_errors||'"missing_name_fa"'::jsonb; end if;
  if btrim(coalesce(v_payload->>'nameTr',''))='' then v_errors:=v_errors||'"missing_name_tr"'::jsonb; end if;
  if btrim(coalesce(v_payload->>'nameEn',''))='' then v_errors:=v_errors||'"missing_name_en"'::jsonb; end if;
  if btrim(coalesce(v_payload->>'nameAr',''))='' then v_errors:=v_errors||'"missing_name_ar"'::jsonb; end if;
  if v_slug='' then v_errors:=v_errors||'"missing_slug"'::jsonb; end if;
  if v_slug<>'' then
    select id into v_conflict_id from public."Product" where lower(btrim(slug))=lower(v_slug) and (v_existing_id is null or id<>v_existing_id) limit 1;
    if v_conflict_id is not null then v_errors:=v_errors||'"slug_conflict"'::jsonb; end if;
  end if;
  if jsonb_array_length(v_images)=0 then v_warnings:=v_warnings||'"missing_image"'::jsonb; end if;
  if coalesce((v_payload->>'price')::bigint,0)<=0 then v_warnings:=v_warnings||'"missing_price"'::jsonb; end if;
  if coalesce((v_payload->>'stock')::integer,0)<=0 then v_warnings:=v_warnings||'"out_of_stock"'::jsonb; end if;
  if coalesce((v_payload->>'isPublished')::boolean,false) then v_errors:=v_errors||'"staging_must_be_draft"'::jsonb; end if;
  if jsonb_typeof(v_evidence)<>'object' then v_errors:=v_errors||'"invalid_evidence"'::jsonb; end if;

  v_payload:=jsonb_set(v_payload,'{isPublished}','false'::jsonb,true);
  v_status:=case when jsonb_array_length(v_errors)>0 then 'NEEDS_REVIEW' else 'VALID' end;
  insert into public."CatalogStagingItem"("batchId","rowNumber","sourceSku","sourceModel","siteSku","identityStatus","categorySlug",payload,images,evidence,validation,status,"existingProductId","updatedAt")
  values(v_batch.id,v_row,v_source_sku,v_source_model,v_site_sku,case when v_site_sku='' then 'UNRESOLVED' else 'VERIFIED' end,v_category_slug,v_payload,v_images,v_evidence,jsonb_build_object('errors',v_errors,'warnings',v_warnings),v_status,v_existing_id,now())
  on conflict ("batchId","rowNumber") do update set
    "sourceSku"=excluded."sourceSku","sourceModel"=excluded."sourceModel","siteSku"=excluded."siteSku","identityStatus"=excluded."identityStatus","categorySlug"=excluded."categorySlug",payload=excluded.payload,images=excluded.images,evidence=excluded.evidence,validation=excluded.validation,status=excluded.status,"existingProductId"=excluded."existingProductId","reviewedBy"=null,"reviewedAt"=null,"updatedAt"=now()
  returning * into v_result;
  update public."CatalogStagingBatch" set status='IN_REVIEW',"updatedAt"=now() where id=v_batch.id and status='DRAFT';
  return to_jsonb(v_result);
end $function$;

create or replace function public.admin_catalog_staging_set_site_sku(p_token text, p_item_id text, p_site_sku text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_item public."CatalogStagingItem"%rowtype;
  v_site_sku text:=btrim(coalesce(p_site_sku,''));
  v_conflict text;
  v_errors jsonb;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_item from public."CatalogStagingItem" where id=p_item_id for update;
  if not found then raise exception 'staging item not found'; end if;
  if v_item.status='PROMOTED' then raise exception 'promoted staging item is immutable'; end if;
  if v_site_sku='' or length(v_site_sku)>100 or v_site_sku ~ '[[:space:]]' then raise exception 'invalid site sku'; end if;
  select id into v_conflict from public."Product" where lower(btrim(sku))=lower(v_site_sku) and (v_item."existingProductId" is null or id<>v_item."existingProductId") limit 1;
  if v_conflict is not null then raise exception 'site sku conflicts with existing product'; end if;
  select id into v_conflict from public."CatalogStagingItem" where id<>v_item.id and status<>'REJECTED' and "identityStatus"='VERIFIED' and lower(btrim("siteSku"))=lower(v_site_sku) limit 1;
  if v_conflict is not null then raise exception 'site sku conflicts with another staging item'; end if;

  v_errors:=coalesce(v_item.validation->'errors','[]'::jsonb);
  select coalesce(jsonb_agg(value),'[]'::jsonb) into v_errors from jsonb_array_elements(v_errors) e(value) where value not in ('"site_sku_unverified"'::jsonb,'"missing_sku"'::jsonb,'"invalid_site_sku"'::jsonb,'"site_sku_staging_conflict"'::jsonb);
  update public."CatalogStagingItem" set
    "siteSku"=v_site_sku,
    "identityStatus"='VERIFIED',
    payload=jsonb_set(payload,'{sku}',to_jsonb(v_site_sku),true),
    validation=jsonb_set(validation,'{errors}',v_errors,true),
    status=case when jsonb_array_length(v_errors)=0 then 'VALID' else 'NEEDS_REVIEW' end,
    "reviewedBy"=null,"reviewedAt"=null,"updatedAt"=now()
  where id=v_item.id returning * into v_item;
  return to_jsonb(v_item);
end $function$;

create or replace function public.admin_catalog_staging_promote_item(p_token text, p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare v_admin public."AdminUser"%rowtype; v_item public."CatalogStagingItem"%rowtype; v_batch public."CatalogStagingBatch"%rowtype; v_payload jsonb; v_observed_price bigint; v_current_price bigint; v_current_stock integer; v_result jsonb; v_total integer; v_promoted integer;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_item from public."CatalogStagingItem" where id=p_item_id and status='APPROVED' for update;
  if not found then raise exception 'approved staging item not found'; end if;
  if v_item."identityStatus"<>'VERIFIED' or btrim(v_item."siteSku")='' then raise exception 'verified Hyper Doctor site SKU is required before promotion'; end if;
  select * into v_batch from public."CatalogStagingBatch" where id=v_item."batchId" and status<>'ARCHIVED' for update;
  if not found then raise exception 'staging batch not found'; end if;
  v_payload:=jsonb_set(v_item.payload,'{sku}',to_jsonb(v_item."siteSku"),true);
  v_observed_price:=case when v_batch."pricePolicy"='HISTORICAL' then nullif(coalesce((v_payload->>'price')::bigint,0),0) else null end;
  v_current_price:=case when v_batch."pricePolicy"='CURRENT' then coalesce((v_payload->>'price')::bigint,0) else 0 end;
  v_current_stock:=case when v_batch."stockPolicy"='CURRENT' then coalesce((v_payload->>'stock')::integer,0) else 0 end;
  v_payload:=jsonb_set(v_payload,'{price}',to_jsonb(v_current_price),true);
  v_payload:=jsonb_set(v_payload,'{stock}',to_jsonb(v_current_stock),true);
  v_payload:=jsonb_set(v_payload,'{isPublished}','false'::jsonb,true);
  v_result:=public.admin_import_product_row_with_source(p_token,v_payload,v_item.images,v_batch."sourceId",v_item.evidence,case when v_observed_price is not null then v_batch."priceKind" else null end,v_observed_price,v_batch.currency);
  update public."CatalogStagingItem" set status='PROMOTED',"productId"=v_result->>'id',"promotedAt"=now(),"updatedAt"=now() where id=v_item.id;
  select count(*),count(*) filter(where status='PROMOTED') into v_total,v_promoted from public."CatalogStagingItem" where "batchId"=v_batch.id and status<>'REJECTED';
  update public."CatalogStagingBatch" set status=case when v_total>0 and v_promoted=v_total then 'PROMOTED' else 'PARTIALLY_PROMOTED' end,"updatedAt"=now() where id=v_batch.id;
  return v_result||jsonb_build_object('stagingItemId',v_item.id,'stagingPromoted',true);
end $function$;

revoke all on function public.admin_catalog_staging_set_site_sku(text,text,text) from public, anon, authenticated;
grant execute on function public.admin_catalog_staging_set_site_sku(text,text,text) to service_role;
revoke all on function public.admin_catalog_staging_put_item(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.admin_catalog_staging_put_item(text,text,jsonb) to service_role;
revoke all on function public.admin_catalog_staging_promote_item(text,text) from public, anon, authenticated;
grant execute on function public.admin_catalog_staging_promote_item(text,text) to service_role;
