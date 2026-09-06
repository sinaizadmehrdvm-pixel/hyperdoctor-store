-- Version 249: source-backed product master staging and guarded promotion.

create table if not exists public."CatalogStagingBatch" (
  id text primary key default gen_random_uuid()::text,
  "sourceId" text not null references public."CatalogSource"(id) on update cascade on delete restrict,
  title text not null check (btrim(title) <> ''),
  status text not null default 'DRAFT' check (status in ('DRAFT','IN_REVIEW','APPROVED','PARTIALLY_PROMOTED','PROMOTED','ARCHIVED')),
  "pricePolicy" text not null default 'IGNORE' check ("pricePolicy" in ('CURRENT','HISTORICAL','IGNORE')),
  "stockPolicy" text not null default 'IGNORE' check ("stockPolicy" in ('CURRENT','IGNORE')),
  "priceKind" text not null default 'OTHER' check ("priceKind" in ('SELLING','PARTNER','PURCHASE','CONSUMER','OTHER')),
  currency text not null default 'IRT' check (currency in ('IRT','IRR','TRY','USD','EUR')),
  notes text not null default '',
  "createdBy" text references public."AdminUser"(id) on update cascade on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists catalog_staging_batch_source_idx
  on public."CatalogStagingBatch"("sourceId", "createdAt" desc);

create table if not exists public."CatalogStagingItem" (
  id text primary key default gen_random_uuid()::text,
  "batchId" text not null references public."CatalogStagingBatch"(id) on update cascade on delete cascade,
  "rowNumber" integer not null check ("rowNumber" > 0),
  "sourceSku" text not null default '',
  "sourceModel" text not null default '',
  "categorySlug" text not null default '',
  payload jsonb not null default '{}'::jsonb,
  images jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  validation jsonb not null default '{"errors":[],"warnings":[]}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','VALID','NEEDS_REVIEW','APPROVED','REJECTED','PROMOTED')),
  "existingProductId" text references public."Product"(id) on update cascade on delete set null,
  "productId" text references public."Product"(id) on update cascade on delete set null,
  "reviewedBy" text references public."AdminUser"(id) on update cascade on delete set null,
  "reviewedAt" timestamptz,
  "promotedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("batchId", "rowNumber")
);

create index if not exists catalog_staging_item_batch_status_idx
  on public."CatalogStagingItem"("batchId", status, "rowNumber");
create index if not exists catalog_staging_item_source_sku_idx
  on public."CatalogStagingItem"(lower(btrim("sourceSku"))) where btrim("sourceSku") <> '';

alter table public."CatalogStagingBatch" enable row level security;
alter table public."CatalogStagingItem" enable row level security;
revoke all on table public."CatalogStagingBatch" from public, anon, authenticated;
revoke all on table public."CatalogStagingItem" from public, anon, authenticated;
grant select, insert, update, delete on table public."CatalogStagingBatch" to service_role;
grant select, insert, update, delete on table public."CatalogStagingItem" to service_role;

create or replace function public.admin_catalog_staging_create(p_token text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_source public."CatalogSource"%rowtype;
  v_batch public."CatalogStagingBatch"%rowtype;
  v_price_policy text := upper(btrim(coalesce(p_data->>'pricePolicy','IGNORE')));
  v_stock_policy text := upper(btrim(coalesce(p_data->>'stockPolicy','IGNORE')));
  v_price_kind text := upper(btrim(coalesce(p_data->>'priceKind','OTHER')));
  v_currency text := upper(btrim(coalesce(p_data->>'currency','IRT')));
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_source from public."CatalogSource" where id=btrim(coalesce(p_data->>'sourceId','')) and status='CONFIRMED';
  if not found then raise exception 'confirmed catalog source is required'; end if;
  if btrim(coalesce(p_data->>'title',''))='' then raise exception 'batch title is required'; end if;
  if v_price_policy not in ('CURRENT','HISTORICAL','IGNORE') then raise exception 'invalid price policy'; end if;
  if v_stock_policy not in ('CURRENT','IGNORE') then raise exception 'invalid stock policy'; end if;
  if v_price_kind not in ('SELLING','PARTNER','PURCHASE','CONSUMER','OTHER') then raise exception 'invalid price kind'; end if;
  if v_currency not in ('IRT','IRR','TRY','USD','EUR') then raise exception 'invalid currency'; end if;
  if v_source."sourceType" in ('CATALOG','PRICE_LIST','SUPPLIER_FILE') and v_stock_policy='CURRENT' then
    raise exception 'this source type cannot set current Hyper Doctor stock';
  end if;
  if v_source."sourceType"='PRICE_LIST' and v_price_policy='CURRENT' then
    raise exception 'price list sources must be historical or ignored unless reclassified as a verified current source';
  end if;

  insert into public."CatalogStagingBatch"("sourceId",title,status,"pricePolicy","stockPolicy","priceKind",currency,notes,"createdBy","updatedAt")
  values(v_source.id,btrim(p_data->>'title'),'DRAFT',v_price_policy,v_stock_policy,v_price_kind,v_currency,btrim(coalesce(p_data->>'notes','')),v_admin.id,now())
  returning * into v_batch;
  return to_jsonb(v_batch);
end
$function$;

create or replace function public.admin_catalog_staging_put_item(p_token text, p_batch_id text, p_item jsonb)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
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
  v_sku text := btrim(coalesce(v_payload->>'sku',p_item->>'sourceSku',''));
  v_slug text := btrim(coalesce(v_payload->>'slug',''));
  v_category_slug text := btrim(coalesce(v_payload->>'categorySlug',p_item->>'categorySlug',''));
  v_status text;
  v_result public."CatalogStagingItem"%rowtype;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_batch from public."CatalogStagingBatch" where id=p_batch_id and status in ('DRAFT','IN_REVIEW');
  if not found then raise exception 'editable staging batch not found'; end if;

  if v_sku='' then v_errors:=v_errors||'"missing_sku"'::jsonb; end if;
  if v_category_slug='' then v_errors:=v_errors||'"missing_category"'::jsonb;
  else
    select * into v_category from public."Category" where slug=v_category_slug limit 1;
    if not found then v_errors:=v_errors||'"unknown_category"'::jsonb; end if;
  end if;
  if btrim(coalesce(v_payload->>'nameFa',''))='' then v_errors:=v_errors||'"missing_name_fa"'::jsonb; end if;
  if btrim(coalesce(v_payload->>'nameTr',''))='' then v_errors:=v_errors||'"missing_name_tr"'::jsonb; end if;
  if btrim(coalesce(v_payload->>'nameEn',''))='' then v_errors:=v_errors||'"missing_name_en"'::jsonb; end if;
  if btrim(coalesce(v_payload->>'nameAr',''))='' then v_errors:=v_errors||'"missing_name_ar"'::jsonb; end if;
  if v_slug='' then v_errors:=v_errors||'"missing_slug"'::jsonb; end if;

  if v_sku<>'' then select id into v_existing_id from public."Product" where lower(btrim(sku))=lower(v_sku) limit 1; end if;
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

  insert into public."CatalogStagingItem"("batchId","rowNumber","sourceSku","sourceModel","categorySlug",payload,images,evidence,validation,status,"existingProductId","updatedAt")
  values(v_batch.id,v_row,v_sku,btrim(coalesce(v_payload->>'modelNumber',p_item->>'sourceModel','')),v_category_slug,v_payload,v_images,v_evidence,jsonb_build_object('errors',v_errors,'warnings',v_warnings),v_status,v_existing_id,now())
  on conflict ("batchId","rowNumber") do update set
    "sourceSku"=excluded."sourceSku","sourceModel"=excluded."sourceModel","categorySlug"=excluded."categorySlug",payload=excluded.payload,images=excluded.images,evidence=excluded.evidence,validation=excluded.validation,status=excluded.status,"existingProductId"=excluded."existingProductId","reviewedBy"=null,"reviewedAt"=null,"updatedAt"=now()
  returning * into v_result;

  update public."CatalogStagingBatch" set status='IN_REVIEW',"updatedAt"=now() where id=v_batch.id and status='DRAFT';
  return to_jsonb(v_result);
end
$function$;

create or replace function public.admin_catalog_staging_review_item(p_token text, p_item_id text, p_decision text)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_item public."CatalogStagingItem"%rowtype;
  v_decision text := upper(btrim(coalesce(p_decision,'')));
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_item from public."CatalogStagingItem" where id=p_item_id for update;
  if not found then raise exception 'staging item not found'; end if;
  if v_item.status='PROMOTED' then raise exception 'promoted staging item is immutable'; end if;
  if v_decision='APPROVE' then
    if jsonb_array_length(coalesce(v_item.validation->'errors','[]'::jsonb))>0 then raise exception 'item has blocking validation errors'; end if;
    update public."CatalogStagingItem" set status='APPROVED',"reviewedBy"=v_admin.id,"reviewedAt"=now(),"updatedAt"=now() where id=v_item.id returning * into v_item;
  elsif v_decision='REJECT' then
    update public."CatalogStagingItem" set status='REJECTED',"reviewedBy"=v_admin.id,"reviewedAt"=now(),"updatedAt"=now() where id=v_item.id returning * into v_item;
  else raise exception 'decision must be APPROVE or REJECT'; end if;
  return to_jsonb(v_item);
end
$function$;

create or replace function public.admin_catalog_staging_promote_item(p_token text, p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_item public."CatalogStagingItem"%rowtype;
  v_batch public."CatalogStagingBatch"%rowtype;
  v_payload jsonb;
  v_observed_price bigint;
  v_current_price bigint;
  v_current_stock integer;
  v_result jsonb;
  v_total integer;
  v_promoted integer;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_item from public."CatalogStagingItem" where id=p_item_id and status='APPROVED' for update;
  if not found then raise exception 'approved staging item not found'; end if;
  select * into v_batch from public."CatalogStagingBatch" where id=v_item."batchId" and status<>'ARCHIVED' for update;
  if not found then raise exception 'staging batch not found'; end if;

  v_payload:=v_item.payload;
  v_observed_price:=case when v_batch."pricePolicy"='HISTORICAL' then nullif(coalesce((v_payload->>'price')::bigint,0),0) else null end;
  v_current_price:=case when v_batch."pricePolicy"='CURRENT' then coalesce((v_payload->>'price')::bigint,0) else 0 end;
  v_current_stock:=case when v_batch."stockPolicy"='CURRENT' then coalesce((v_payload->>'stock')::integer,0) else 0 end;
  v_payload:=jsonb_set(v_payload,'{price}',to_jsonb(v_current_price),true);
  v_payload:=jsonb_set(v_payload,'{stock}',to_jsonb(v_current_stock),true);
  v_payload:=jsonb_set(v_payload,'{isPublished}','false'::jsonb,true);

  v_result:=public.admin_import_product_row_with_source(
    p_token,v_payload,v_item.images,v_batch."sourceId",v_item.evidence,
    case when v_observed_price is not null then v_batch."priceKind" else null end,
    v_observed_price,v_batch.currency
  );

  update public."CatalogStagingItem" set status='PROMOTED',"productId"=v_result->>'id',"promotedAt"=now(),"updatedAt"=now() where id=v_item.id;
  select count(*),count(*) filter(where status='PROMOTED') into v_total,v_promoted from public."CatalogStagingItem" where "batchId"=v_batch.id and status<>'REJECTED';
  update public."CatalogStagingBatch" set status=case when v_total>0 and v_promoted=v_total then 'PROMOTED' else 'PARTIALLY_PROMOTED' end,"updatedAt"=now() where id=v_batch.id;
  return v_result||jsonb_build_object('stagingItemId',v_item.id,'stagingPromoted',true);
end
$function$;

create or replace function public.admin_catalog_staging_batches(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',b.id,'title',b.title,'status',b.status,'sourceId',b."sourceId",'sourceTitle',s.title,'sourceType',s."sourceType",'pricePolicy',b."pricePolicy",'stockPolicy',b."stockPolicy",'currency',b.currency,
    'total',(select count(*) from public."CatalogStagingItem" i where i."batchId"=b.id),
    'valid',(select count(*) from public."CatalogStagingItem" i where i."batchId"=b.id and i.status in ('VALID','APPROVED','PROMOTED')),
    'needsReview',(select count(*) from public."CatalogStagingItem" i where i."batchId"=b.id and i.status='NEEDS_REVIEW'),
    'approved',(select count(*) from public."CatalogStagingItem" i where i."batchId"=b.id and i.status='APPROVED'),
    'promoted',(select count(*) from public."CatalogStagingItem" i where i."batchId"=b.id and i.status='PROMOTED'),
    'createdAt',b."createdAt") order by b."createdAt" desc),'[]'::jsonb) into v_result
  from public."CatalogStagingBatch" b join public."CatalogSource" s on s.id=b."sourceId";
  return v_result;
end
$function$;

create or replace function public.admin_catalog_staging_batch_detail(p_token text, p_batch_id text)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select jsonb_build_object('batch',to_jsonb(b),'source',to_jsonb(s),'items',coalesce((select jsonb_agg(to_jsonb(i) order by i."rowNumber") from public."CatalogStagingItem" i where i."batchId"=b.id),'[]'::jsonb)) into v_result
  from public."CatalogStagingBatch" b join public."CatalogSource" s on s.id=b."sourceId" where b.id=p_batch_id;
  if v_result is null then raise exception 'staging batch not found'; end if;
  return v_result;
end
$function$;

revoke all on function public.admin_catalog_staging_create(text,jsonb) from public, anon, authenticated;
revoke all on function public.admin_catalog_staging_put_item(text,text,jsonb) from public, anon, authenticated;
revoke all on function public.admin_catalog_staging_review_item(text,text,text) from public, anon, authenticated;
revoke all on function public.admin_catalog_staging_promote_item(text,text) from public, anon, authenticated;
revoke all on function public.admin_catalog_staging_batches(text) from public, anon, authenticated;
revoke all on function public.admin_catalog_staging_batch_detail(text,text) from public, anon, authenticated;
grant execute on function public.admin_catalog_staging_create(text,jsonb) to service_role;
grant execute on function public.admin_catalog_staging_put_item(text,text,jsonb) to service_role;
grant execute on function public.admin_catalog_staging_review_item(text,text,text) to service_role;
grant execute on function public.admin_catalog_staging_promote_item(text,text) to service_role;
grant execute on function public.admin_catalog_staging_batches(text) to service_role;
grant execute on function public.admin_catalog_staging_batch_detail(text,text) to service_role;
