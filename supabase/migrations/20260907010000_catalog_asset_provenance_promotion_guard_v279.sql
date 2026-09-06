-- Version 279 — reconcile Production catalog asset provenance, guarded promotion, and launch readiness.
-- This migration intentionally preserves current commerce as fail-closed: promotion never publishes,
-- historical prices remain observations, and only CURRENT stock/price policies may populate current values.

create table if not exists public."CatalogAsset" (
  id text primary key default gen_random_uuid()::text,
  "sourceId" text not null references public."CatalogSource"(id) on delete cascade,
  "assetKind" text not null,
  uri text not null,
  "fileName" text not null default '',
  "mimeType" text not null default '',
  "pageNumber" integer,
  "checksumSha256" text not null default '',
  "storageProvider" text not null default 'LIBRARY',
  "verificationStatus" text not null default 'PENDING',
  "isPublic" boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  "createdBy" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint catalog_asset_kind_chk check ("assetKind" in ('SOURCE_DOCUMENT','CATALOG_PAGE','PRODUCT_IMAGE','PACKAGING_IMAGE','LOGO','MANUAL','CERTIFICATE','BROCHURE','OTHER')),
  constraint catalog_asset_provider_chk check ("storageProvider" in ('LIBRARY','OFFICIAL_WEB','SUPABASE_STORAGE','OTHER')),
  constraint catalog_asset_verification_chk check ("verificationStatus" in ('PENDING','VERIFIED','REJECTED')),
  constraint catalog_asset_page_chk check ("pageNumber" is null or "pageNumber">0),
  constraint catalog_asset_uri_chk check (btrim(uri)<>'')
);
create unique index if not exists catalog_asset_identity_uq on public."CatalogAsset"("sourceId",lower(btrim(uri)),coalesce("pageNumber",0),"assetKind");
create index if not exists catalog_asset_source_idx on public."CatalogAsset"("sourceId","verificationStatus");

create table if not exists public."CatalogStagingItemAsset" (
  "stagingItemId" text not null references public."CatalogStagingItem"(id) on delete cascade,
  "assetId" text not null references public."CatalogAsset"(id) on delete cascade,
  role text not null,
  "matchStatus" text not null default 'PENDING',
  "modelEvidence" text not null default '',
  "sortOrder" integer not null default 0,
  notes text not null default '',
  "createdBy" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  primary key ("stagingItemId","assetId",role),
  constraint catalog_staging_asset_match_chk check ("matchStatus" in ('PENDING','VERIFIED','REJECTED')),
  constraint catalog_staging_asset_sort_chk check ("sortOrder">=0)
);
alter table public."CatalogStagingItemAsset" drop constraint if exists catalog_staging_asset_role_chk;
alter table public."CatalogStagingItemAsset" add constraint catalog_staging_asset_role_chk check (role in ('PRIMARY_SOURCE','TECHNICAL_PAGE','PRICE_SOURCE','INVENTORY_SOURCE','MAIN_IMAGE','GALLERY_IMAGE','PACKAGING','MANUAL','CERTIFICATE','REGULATORY_SOURCE','OTHER'));
create index if not exists catalog_staging_item_asset_item_idx on public."CatalogStagingItemAsset"("stagingItemId","matchStatus","sortOrder");

create table if not exists public."ProductAssetEvidence" (
  "productId" text not null references public."Product"(id) on delete cascade,
  "assetId" text not null references public."CatalogAsset"(id) on delete restrict,
  role text not null,
  "modelEvidence" text not null default '',
  "sourceStagingItemId" text references public."CatalogStagingItem"(id) on delete set null,
  "verifiedAt" timestamptz not null default now(),
  "createdBy" text,
  "createdAt" timestamptz not null default now(),
  primary key ("productId","assetId",role)
);
create index if not exists product_asset_evidence_product_idx on public."ProductAssetEvidence"("productId",role);
create index if not exists product_asset_evidence_asset_idx on public."ProductAssetEvidence"("assetId");

create or replace function public.admin_catalog_asset_upsert(p_token text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype; v_source public."CatalogSource"%rowtype;
  v_kind text:=upper(btrim(coalesce(p_data->>'assetKind',''))); v_uri text:=btrim(coalesce(p_data->>'uri',''));
  v_provider text:=upper(btrim(coalesce(p_data->>'storageProvider','LIBRARY'))); v_verification text:=upper(btrim(coalesce(p_data->>'verificationStatus','PENDING')));
  v_page integer; v_asset public."CatalogAsset"%rowtype;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_source from public."CatalogSource" where id=btrim(coalesce(p_data->>'sourceId','')) and status='CONFIRMED';
  if not found then raise exception 'confirmed source is required'; end if;
  if v_kind not in ('SOURCE_DOCUMENT','CATALOG_PAGE','PRODUCT_IMAGE','PACKAGING_IMAGE','LOGO','MANUAL','CERTIFICATE','BROCHURE','OTHER') then raise exception 'invalid asset kind'; end if;
  if v_provider not in ('LIBRARY','OFFICIAL_WEB','SUPABASE_STORAGE','OTHER') then raise exception 'invalid storage provider'; end if;
  if v_verification not in ('PENDING','VERIFIED','REJECTED') then raise exception 'invalid verification status'; end if;
  if v_uri='' then raise exception 'asset uri is required'; end if;
  if nullif(btrim(coalesce(p_data->>'pageNumber','')),'') is not null then v_page:=(p_data->>'pageNumber')::integer; if v_page<=0 then raise exception 'invalid page number'; end if; end if;
  insert into public."CatalogAsset"("sourceId","assetKind",uri,"fileName","mimeType","pageNumber","checksumSha256","storageProvider","verificationStatus","isPublic",metadata,"createdBy","updatedAt")
  values(v_source.id,v_kind,v_uri,left(coalesce(p_data->>'fileName',''),512),left(coalesce(p_data->>'mimeType',''),255),v_page,left(lower(coalesce(p_data->>'checksumSha256','')),64),v_provider,v_verification,coalesce((p_data->>'isPublic')::boolean,false),coalesce(p_data->'metadata','{}'::jsonb),v_admin.id,now())
  on conflict ("sourceId",lower(btrim(uri)),coalesce("pageNumber",0),"assetKind") do update set "fileName"=excluded."fileName","mimeType"=excluded."mimeType","checksumSha256"=excluded."checksumSha256","storageProvider"=excluded."storageProvider","verificationStatus"=excluded."verificationStatus","isPublic"=excluded."isPublic",metadata=excluded.metadata,"updatedAt"=now()
  returning * into v_asset;
  return to_jsonb(v_asset);
end;$function$;

create or replace function public.admin_catalog_staging_asset_attach(p_token text,p_item_id text,p_asset_id text,p_role text,p_match_status text default 'PENDING',p_model_evidence text default '',p_sort_order integer default 0,p_notes text default '')
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_admin public."AdminUser"%rowtype; v_role text:=upper(btrim(coalesce(p_role,''))); v_match text:=upper(btrim(coalesce(p_match_status,'PENDING')));
  v_asset public."CatalogAsset"%rowtype; v_item public."CatalogStagingItem"%rowtype; v_batch public."CatalogStagingBatch"%rowtype;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_item from public."CatalogStagingItem" where id=p_item_id;
  if not found then raise exception 'staging item not found'; end if;
  if v_item.status='PROMOTED' then raise exception 'promoted staging item is immutable'; end if;
  select * into v_batch from public."CatalogStagingBatch" where id=v_item."batchId" and status<>'ARCHIVED';
  if not found then raise exception 'staging batch not found'; end if;
  select a.* into v_asset from public."CatalogAsset" a join public."CatalogSource" s on s.id=a."sourceId" where a.id=p_asset_id and s.status='CONFIRMED';
  if not found then raise exception 'asset must belong to a confirmed catalog source'; end if;
  if v_role not in ('PRIMARY_SOURCE','TECHNICAL_PAGE','PRICE_SOURCE','INVENTORY_SOURCE','MAIN_IMAGE','GALLERY_IMAGE','PACKAGING','MANUAL','CERTIFICATE','REGULATORY_SOURCE','OTHER') then raise exception 'invalid role'; end if;
  if v_match not in ('PENDING','VERIFIED','REJECTED') then raise exception 'invalid match status'; end if;
  if v_match='VERIFIED' and v_asset."verificationStatus"<>'VERIFIED' then raise exception 'asset itself must be verified first'; end if;
  insert into public."CatalogStagingItemAsset"("stagingItemId","assetId",role,"matchStatus","modelEvidence","sortOrder",notes,"createdBy","updatedAt")
  values(v_item.id,v_asset.id,v_role,v_match,left(coalesce(p_model_evidence,''),1000),greatest(coalesce(p_sort_order,0),0),left(coalesce(p_notes,''),2000),v_admin.id,now())
  on conflict ("stagingItemId","assetId",role) do update set "matchStatus"=excluded."matchStatus","modelEvidence"=excluded."modelEvidence","sortOrder"=excluded."sortOrder",notes=excluded.notes,"updatedAt"=now();
  return jsonb_build_object('stagingItemId',v_item.id,'assetId',v_asset.id,'sourceId',v_asset."sourceId",'batchSourceId',v_batch."sourceId",'role',v_role,'matchStatus',v_match);
end;$function$;

create or replace function public.admin_catalog_staging_asset_manifest(p_token text,p_batch_id text default null)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare v_admin public."AdminUser"%rowtype; v_items jsonb; begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('itemId',i.id,'batchId',i."batchId",'rowNumber',i."rowNumber",'sourceModel',i."sourceModel",'nameEn',coalesce(i.payload->>'nameEn',''),'assets',coalesce((select jsonb_agg(jsonb_build_object('assetId',a.id,'assetKind',a."assetKind",'uri',a.uri,'fileName',a."fileName",'pageNumber',a."pageNumber",'provider',a."storageProvider",'assetVerification',a."verificationStatus",'role',x.role,'matchStatus',x."matchStatus",'modelEvidence',x."modelEvidence",'sortOrder',x."sortOrder") order by x."sortOrder",a."pageNumber") from public."CatalogStagingItemAsset" x join public."CatalogAsset" a on a.id=x."assetId" where x."stagingItemId"=i.id),'[]'::jsonb)) order by i."batchId",i."rowNumber"),'[]'::jsonb) into v_items
  from public."CatalogStagingItem" i where p_batch_id is null or i."batchId"=p_batch_id;
  return jsonb_build_object('items',v_items,'summary',jsonb_build_object('items',jsonb_array_length(v_items),'linked',(select count(distinct x."stagingItemId") from public."CatalogStagingItemAsset" x join public."CatalogStagingItem" i on i.id=x."stagingItemId" where p_batch_id is null or i."batchId"=p_batch_id),'verifiedLinks',(select count(*) from public."CatalogStagingItemAsset" x join public."CatalogStagingItem" i on i.id=x."stagingItemId" where x."matchStatus"='VERIFIED' and (p_batch_id is null or i."batchId"=p_batch_id))));
end;$function$;

create or replace function public.admin_catalog_staging_promote_item(p_token text,p_item_id text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype; v_item public."CatalogStagingItem"%rowtype; v_batch public."CatalogStagingBatch"%rowtype;
  v_payload jsonb; v_observed_price bigint; v_current_price bigint; v_current_stock integer; v_result jsonb; v_total integer; v_promoted integer; v_product_id text;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_item from public."CatalogStagingItem" where id=p_item_id and status='APPROVED' for update;
  if not found then raise exception 'approved staging item not found'; end if;
  if v_item."identityStatus"<>'VERIFIED' or btrim(v_item."siteSku")='' then raise exception 'verified Hyper Doctor site SKU is required before promotion'; end if;
  if not exists (select 1 from public."CatalogStagingItemAsset" x join public."CatalogAsset" a on a.id=x."assetId" where x."stagingItemId"=v_item.id and x."matchStatus"='VERIFIED' and a."verificationStatus"='VERIFIED' and x.role in ('PRIMARY_SOURCE','TECHNICAL_PAGE')) then raise exception 'verified technical source asset is required before promotion'; end if;
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
  v_product_id:=v_result->>'id';
  if coalesce(v_product_id,'')='' then raise exception 'product promotion returned no product id'; end if;
  insert into public."ProductAssetEvidence"("productId","assetId",role,"modelEvidence","sourceStagingItemId","verifiedAt","createdBy")
  select v_product_id,x."assetId",x.role,x."modelEvidence",v_item.id,now(),v_admin.id from public."CatalogStagingItemAsset" x join public."CatalogAsset" a on a.id=x."assetId" where x."stagingItemId"=v_item.id and x."matchStatus"='VERIFIED' and a."verificationStatus"='VERIFIED'
  on conflict ("productId","assetId",role) do update set "modelEvidence"=excluded."modelEvidence","sourceStagingItemId"=excluded."sourceStagingItemId","verifiedAt"=now();
  update public."CatalogStagingItem" set status='PROMOTED',"productId"=v_product_id,"promotedAt"=now(),"updatedAt"=now() where id=v_item.id;
  select count(*),count(*) filter(where status='PROMOTED') into v_total,v_promoted from public."CatalogStagingItem" where "batchId"=v_batch.id and status<>'REJECTED';
  update public."CatalogStagingBatch" set status=case when v_total>0 and v_promoted=v_total then 'PROMOTED' else 'PARTIALLY_PROMOTED' end,"updatedAt"=now() where id=v_batch.id;
  return v_result||jsonb_build_object('stagingItemId',v_item.id,'stagingPromoted',true,'assetProvenanceCopied',true);
end;$function$;

create or replace function public.admin_catalog_launch_readiness(p_token text,p_batch_id text default null)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare v_admin public."AdminUser"%rowtype; v_items jsonb;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q."batchId",q."rowNumber"),'[]'::jsonb) into v_items
  from (
    select i.id as "itemId",i."batchId",i."rowNumber",i."sourceModel",coalesce(i.payload->>'nameEn','') as "nameEn",i."identityStatus",i."siteSku",i.status,
      exists(select 1 from public."CatalogStagingItemAsset" x join public."CatalogAsset" a on a.id=x."assetId" where x."stagingItemId"=i.id and x."matchStatus"='VERIFIED' and a."verificationStatus"='VERIFIED' and x.role in ('PRIMARY_SOURCE','TECHNICAL_PAGE')) as "technicalSourceVerified",
      exists(select 1 from public."CatalogStagingItemAsset" x join public."CatalogAsset" a on a.id=x."assetId" where x."stagingItemId"=i.id and x."matchStatus"='VERIFIED' and a."verificationStatus"='VERIFIED' and x.role='PRICE_SOURCE') as "historicalPriceSourceVerified",
      exists(select 1 from public."CatalogStagingItemAsset" x join public."CatalogAsset" a on a.id=x."assetId" where x."stagingItemId"=i.id and x."matchStatus"='VERIFIED' and a."verificationStatus"='VERIFIED' and x.role in ('MAIN_IMAGE','GALLERY_IMAGE')) as "imageSourceVerified",
      coalesce((i.payload->>'price')::bigint,0)>0 as "payloadPricePresent", coalesce((i.payload->>'stock')::integer,0)>0 as "payloadStockPresent",
      jsonb_build_array(case when i."identityStatus"<>'VERIFIED' or btrim(i."siteSku")='' then 'IDENTITY_UNVERIFIED' end,case when not exists(select 1 from public."CatalogStagingItemAsset" x join public."CatalogAsset" a on a.id=x."assetId" where x."stagingItemId"=i.id and x."matchStatus"='VERIFIED' and a."verificationStatus"='VERIFIED' and x.role in ('PRIMARY_SOURCE','TECHNICAL_PAGE')) then 'TECHNICAL_SOURCE_UNVERIFIED' end,case when jsonb_array_length(coalesce(i.validation->'errors','[]'::jsonb))>0 then 'VALIDATION_ERRORS' end) - 'null'::jsonb as blockers
    from public."CatalogStagingItem" i where (p_batch_id is null or i."batchId"=p_batch_id) and i.status<>'REJECTED'
  ) q;
  return jsonb_build_object('items',v_items,'summary',jsonb_build_object(
    'total',jsonb_array_length(v_items),
    'identityVerified',(select count(*) from public."CatalogStagingItem" i where (p_batch_id is null or i."batchId"=p_batch_id) and i.status<>'REJECTED' and i."identityStatus"='VERIFIED' and btrim(i."siteSku")<>''),
    'technicalSourceVerified',(select count(distinct i.id) from public."CatalogStagingItem" i join public."CatalogStagingItemAsset" x on x."stagingItemId"=i.id join public."CatalogAsset" a on a.id=x."assetId" where (p_batch_id is null or i."batchId"=p_batch_id) and i.status<>'REJECTED' and x."matchStatus"='VERIFIED' and a."verificationStatus"='VERIFIED' and x.role in ('PRIMARY_SOURCE','TECHNICAL_PAGE')),
    'historicalPriceSourceVerified',(select count(distinct i.id) from public."CatalogStagingItem" i join public."CatalogStagingItemAsset" x on x."stagingItemId"=i.id join public."CatalogAsset" a on a.id=x."assetId" where (p_batch_id is null or i."batchId"=p_batch_id) and i.status<>'REJECTED' and x."matchStatus"='VERIFIED' and a."verificationStatus"='VERIFIED' and x.role='PRICE_SOURCE'),
    'imageSourceVerified',(select count(distinct i.id) from public."CatalogStagingItem" i join public."CatalogStagingItemAsset" x on x."stagingItemId"=i.id join public."CatalogAsset" a on a.id=x."assetId" where (p_batch_id is null or i."batchId"=p_batch_id) and i.status<>'REJECTED' and x."matchStatus"='VERIFIED' and a."verificationStatus"='VERIFIED' and x.role in ('MAIN_IMAGE','GALLERY_IMAGE')),
    'promotionReady',(select count(*) from public."CatalogStagingItem" i where (p_batch_id is null or i."batchId"=p_batch_id) and i.status='APPROVED' and i."identityStatus"='VERIFIED' and btrim(i."siteSku")<>'' and jsonb_array_length(coalesce(i.validation->'errors','[]'::jsonb))=0 and exists(select 1 from public."CatalogStagingItemAsset" x join public."CatalogAsset" a on a.id=x."assetId" where x."stagingItemId"=i.id and x."matchStatus"='VERIFIED' and a."verificationStatus"='VERIFIED' and x.role in ('PRIMARY_SOURCE','TECHNICAL_PAGE')))
  ));
end;$function$;

-- The asset/evidence tables are private implementation data. Supabase default grants are revoked
-- and RLS is enabled with no client policies; trusted server/admin RPCs run through service_role.
alter table public."CatalogAsset" enable row level security;
alter table public."CatalogStagingItemAsset" enable row level security;
alter table public."ProductAssetEvidence" enable row level security;
revoke all on table public."CatalogAsset" from public, anon, authenticated;
revoke all on table public."CatalogStagingItemAsset" from public, anon, authenticated;
revoke all on table public."ProductAssetEvidence" from public, anon, authenticated;
grant all on table public."CatalogAsset" to service_role;
grant all on table public."CatalogStagingItemAsset" to service_role;
grant all on table public."ProductAssetEvidence" to service_role;

-- Every SECURITY DEFINER admin RPC introduced/replaced here is service-role-only.
revoke execute on function public.admin_catalog_asset_upsert(text,jsonb) from public, anon, authenticated;
revoke execute on function public.admin_catalog_staging_asset_attach(text,text,text,text,text,text,integer,text) from public, anon, authenticated;
revoke execute on function public.admin_catalog_staging_asset_manifest(text,text) from public, anon, authenticated;
revoke execute on function public.admin_catalog_staging_promote_item(text,text) from public, anon, authenticated;
revoke execute on function public.admin_catalog_launch_readiness(text,text) from public, anon, authenticated;
grant execute on function public.admin_catalog_asset_upsert(text,jsonb) to service_role;
grant execute on function public.admin_catalog_staging_asset_attach(text,text,text,text,text,text,integer,text) to service_role;
grant execute on function public.admin_catalog_staging_asset_manifest(text,text) to service_role;
grant execute on function public.admin_catalog_staging_promote_item(text,text) to service_role;
grant execute on function public.admin_catalog_launch_readiness(text,text) to service_role;
