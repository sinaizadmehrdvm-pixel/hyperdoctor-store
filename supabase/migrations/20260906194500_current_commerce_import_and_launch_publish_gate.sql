create table if not exists public."CommerceSource" (
  id text primary key default gen_random_uuid()::text,
  "sourceType" text not null check ("sourceType" in ('CURRENT_COMMERCE_SNAPSHOT','CURRENT_PRICE_SNAPSHOT','CURRENT_INVENTORY_SNAPSHOT','MANUAL_ADMIN')),
  title text not null,
  "sourceDate" date,
  reference text not null default '',
  notes text not null default '',
  "createdBy" text references public."AdminUser"(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create unique index if not exists "CommerceSource_identity_key" on public."CommerceSource" ("sourceType",lower(btrim(title)),coalesce("sourceDate",date '0001-01-01'),lower(btrim(reference)));
alter table public."CommerceSource" enable row level security;

create table if not exists public."CommerceDataEvidence" (
  id text primary key default gen_random_uuid()::text,
  "sourceId" text not null references public."CommerceSource"(id) on delete restrict,
  "branchId" text not null references public."Branch"(id) on delete restrict,
  "warehouseId" text not null references public."Warehouse"(id) on delete restrict,
  "productId" text not null references public."Product"(id) on delete cascade,
  price integer,
  "compareAtPrice" integer,
  "onHand" integer,
  "createdBy" text references public."AdminUser"(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  unique ("sourceId","branchId","warehouseId","productId"),
  check (price is null or price > 0),
  check ("compareAtPrice" is null or "compareAtPrice" >= 0),
  check ("onHand" is null or "onHand" >= 0)
);
alter table public."CommerceDataEvidence" enable row level security;

create or replace function public.admin_commerce_source_prepare(p_token text,p_data jsonb)
returns jsonb
language plpgsql security definer set search_path='public','extensions'
as $$
declare v_admin public."AdminUser"%rowtype;v_type text:=upper(btrim(coalesce(p_data->>'sourceType','')));v_title text:=btrim(coalesce(p_data->>'title',''));v_reference text:=btrim(coalesce(p_data->>'reference',''));v_notes text:=btrim(coalesce(p_data->>'notes',''));v_date date;v_source public."CommerceSource"%rowtype;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden';end if;
 if v_type not in ('CURRENT_COMMERCE_SNAPSHOT','CURRENT_PRICE_SNAPSHOT','CURRENT_INVENTORY_SNAPSHOT','MANUAL_ADMIN') then raise exception 'invalid commerce source type';end if;
 if v_title='' then raise exception 'source title is required';end if;
 if nullif(btrim(coalesce(p_data->>'sourceDate','')),'') is not null then v_date:=(p_data->>'sourceDate')::date;end if;
 insert into public."CommerceSource"("sourceType",title,"sourceDate",reference,notes,"createdBy","updatedAt") values(v_type,v_title,v_date,v_reference,v_notes,v_admin.id,now())
 on conflict ("sourceType",lower(btrim(title)),coalesce("sourceDate",date '0001-01-01'),lower(btrim(reference))) do update set notes=excluded.notes,"updatedAt"=now()
 returning * into v_source;
 return jsonb_build_object('id',v_source.id,'sourceType',v_source."sourceType",'title',v_source.title,'sourceDate',v_source."sourceDate",'reference',v_source.reference);
end $$;

create or replace function public.admin_commerce_import_preflight(p_token text,p_branch_id text,p_warehouse_id text,p_rows jsonb)
returns jsonb
language plpgsql security definer set search_path='public','extensions'
as $$
declare v_admin public."AdminUser"%rowtype;v_branch public."Branch"%rowtype;v_wh public."Warehouse"%rowtype;v_row jsonb;v_product public."Product"%rowtype;v_errors jsonb;v_warnings jsonb;v_results jsonb:='[]'::jsonb;v_total int:=0;v_error_rows int:=0;v_warning_rows int:=0;v_sku text;v_price_text text;v_compare_text text;v_stock_text text;v_price int;v_compare int;v_stock int;v_has_price boolean;v_has_stock boolean;v_has_variants boolean;v_source_backed boolean;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden';end if;
 if jsonb_typeof(coalesce(p_rows,'[]'::jsonb))<>'array' then raise exception 'rows must be an array';end if;
 select * into v_branch from public."Branch" where id=p_branch_id and "isPublished"=true;if not found then raise exception 'published branch not found';end if;
 select * into v_wh from public."Warehouse" where id=p_warehouse_id and "branchId"=v_branch.id and "isActive"=true;if not found then raise exception 'active warehouse for branch not found';end if;
 for v_row in select value from jsonb_array_elements(p_rows) t(value) loop
  v_total:=v_total+1;v_errors:='[]'::jsonb;v_warnings:='[]'::jsonb;v_product:=null;v_price:=null;v_compare:=null;v_stock:=null;
  v_sku:=btrim(coalesce(v_row->>'sku',''));v_price_text:=btrim(coalesce(v_row->>'price',''));v_compare_text:=btrim(coalesce(v_row->>'compareAtPrice',''));v_stock_text:=btrim(coalesce(v_row->>'onHand',''));v_has_price:=v_price_text<>'';v_has_stock:=v_stock_text<>'';
  if v_sku='' then v_errors:=v_errors||'"MISSING_SKU"'::jsonb;else select * into v_product from public."Product" where lower(btrim(sku))=lower(v_sku) limit 1;if not found then v_errors:=v_errors||'"PRODUCT_NOT_FOUND"'::jsonb;end if;end if;
  if not v_has_price and not v_has_stock then v_errors:=v_errors||'"PRICE_OR_STOCK_REQUIRED"'::jsonb;end if;
  if v_has_price then if v_price_text!~'^[0-9]+$' or v_price_text::bigint>2147483647 then v_errors:=v_errors||'"INVALID_PRICE"'::jsonb;else v_price:=v_price_text::int;if v_price<=0 then v_errors:=v_errors||'"INVALID_PRICE"'::jsonb;end if;end if;end if;
  if v_compare_text<>'' then if v_compare_text!~'^[0-9]+$' or v_compare_text::bigint>2147483647 then v_errors:=v_errors||'"INVALID_COMPARE_PRICE"'::jsonb;else v_compare:=v_compare_text::int;if v_compare>0 and v_price is not null and v_compare<v_price then v_errors:=v_errors||'"COMPARE_BELOW_PRICE"'::jsonb;end if;if v_compare=0 then v_compare:=null;end if;end if;end if;
  if v_has_stock then if v_stock_text!~'^[0-9]+$' or v_stock_text::bigint>2147483647 then v_errors:=v_errors||'"INVALID_STOCK"'::jsonb;else v_stock:=v_stock_text::int;end if;end if;
  if v_product.id is not null then select exists(select 1 from public."ProductVariant" where "productId"=v_product.id) into v_has_variants;if v_has_variants then v_errors:=v_errors||'"VARIANT_PRODUCT_REQUIRES_VARIANT_WORKFLOW"'::jsonb;end if;select exists(select 1 from public."ProductSourceEvidence" where "productId"=v_product.id) into v_source_backed;if not v_source_backed then v_warnings:=v_warnings||'"PRODUCT_SOURCE_EVIDENCE_MISSING"'::jsonb;end if;end if;
  if jsonb_array_length(v_errors)>0 then v_error_rows:=v_error_rows+1;end if;if jsonb_array_length(v_warnings)>0 then v_warning_rows:=v_warning_rows+1;end if;
  v_results:=v_results||jsonb_build_array(jsonb_build_object('line',coalesce((v_row->>'line')::int,v_total+1),'sku',v_sku,'productId',v_product.id,'nameFa',v_product."nameFa",'nameEn',v_product."nameEn",'price',v_price,'compareAtPrice',v_compare,'onHand',v_stock,'errors',v_errors,'warnings',v_warnings));
 end loop;
 return jsonb_build_object('total',v_total,'errorRows',v_error_rows,'warningRows',v_warning_rows,'canApply',v_total>0 and v_error_rows=0,'branch',jsonb_build_object('id',v_branch.id,'code',v_branch.code,'currency',v_branch.currency),'warehouse',jsonb_build_object('id',v_wh.id,'code',v_wh.code),'rows',v_results);
end $$;

create or replace function public.admin_commerce_import_apply(p_token text,p_branch_id text,p_warehouse_id text,p_source jsonb,p_rows jsonb)
returns jsonb
language plpgsql security definer set search_path='public','extensions'
as $$
declare v_admin public."AdminUser"%rowtype;v_preflight jsonb;v_source jsonb;v_source_id text;v_row jsonb;v_product public."Product"%rowtype;v_sku text;v_price int;v_compare int;v_stock int;v_price_text text;v_stock_text text;v_applied int:=0;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden';end if;
 v_preflight:=public.admin_commerce_import_preflight(p_token,p_branch_id,p_warehouse_id,p_rows);if coalesce((v_preflight->>'canApply')::boolean,false) is not true then raise exception 'commerce import preflight failed';end if;
 v_source:=public.admin_commerce_source_prepare(p_token,p_source);v_source_id:=v_source->>'id';
 for v_row in select value from jsonb_array_elements(p_rows) t(value) loop
  v_sku:=btrim(v_row->>'sku');select * into strict v_product from public."Product" where lower(btrim(sku))=lower(v_sku) limit 1;
  v_price_text:=btrim(coalesce(v_row->>'price',''));v_stock_text:=btrim(coalesce(v_row->>'onHand',''));v_price:=case when v_price_text<>'' then v_price_text::int else null end;v_compare:=case when btrim(coalesce(v_row->>'compareAtPrice',''))<>'' and (v_row->>'compareAtPrice')::int>0 then (v_row->>'compareAtPrice')::int else null end;v_stock:=case when v_stock_text<>'' then v_stock_text::int else null end;
  if v_price is not null then insert into public."BranchProductPrice"("branchId","productId",price,"compareAtPrice","isActive","updatedAt") values(p_branch_id,v_product.id,v_price,v_compare,true,now()) on conflict ("branchId","productId") do update set price=excluded.price,"compareAtPrice"=excluded."compareAtPrice","isActive"=true,"updatedAt"=now();end if;
  if v_stock is not null then insert into public."WarehouseInventory"("warehouseId","productId","onHand",reserved,"rentalUnits","updatedAt") values(p_warehouse_id,v_product.id,v_stock,0,0,now()) on conflict ("warehouseId","productId") do update set "onHand"=excluded."onHand","updatedAt"=now();end if;
  insert into public."CommerceDataEvidence"("sourceId","branchId","warehouseId","productId",price,"compareAtPrice","onHand","createdBy") values(v_source_id,p_branch_id,p_warehouse_id,v_product.id,v_price,v_compare,v_stock,v_admin.id) on conflict ("sourceId","branchId","warehouseId","productId") do update set price=excluded.price,"compareAtPrice"=excluded."compareAtPrice","onHand"=excluded."onHand","createdBy"=excluded."createdBy","createdAt"=now();
  v_applied:=v_applied+1;
 end loop;
 return jsonb_build_object('applied',v_applied,'source',v_source,'preflight',v_preflight);
end $$;

create or replace function public.admin_catalog_launch_readiness(p_token text,p_branch_id text default null,p_search text default null)
returns jsonb
language plpgsql security definer set search_path='public','extensions'
as $$
declare v_admin public."AdminUser"%rowtype;v_branch public."Branch"%rowtype;v_policy public."BranchCommercePolicy"%rowtype;v_products jsonb;v_total int;v_ready int;v_published int;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden';end if;
 if nullif(btrim(coalesce(p_branch_id,'')),'') is null then select * into v_branch from public."Branch" where "isDefault"=true and "isPublished"=true order by "createdAt" limit 1;else select * into v_branch from public."Branch" where id=p_branch_id and "isPublished"=true;end if;if not found then raise exception 'published branch not found';end if;
 select * into v_policy from public."BranchCommercePolicy" where "branchId"=v_branch.id;
 with base as (
  select p.*,exists(select 1 from public."ProductSourceEvidence" e where e."productId"=p.id) source_backed,exists(select 1 from public."Media" m where m."productId"=p.id and btrim(coalesce(m.url,''))<>'') has_image,exists(select 1 from public."ProductVariant" pv where pv."productId"=p.id) has_variants,coalesce((select bpp.price from public."BranchProductPrice" bpp where bpp."branchId"=v_branch.id and bpp."productId"=p.id and bpp."isActive"=true),p.price,0) effective_price,coalesce((select sum(greatest(wi."onHand"-wi.reserved-wi."rentalUnits",0)) from public."WarehouseInventory" wi join public."Warehouse" w on w.id=wi."warehouseId" and w."branchId"=v_branch.id and w."isActive"=true where wi."productId"=p.id),0)::int available
  from public."Product" p where (coalesce(btrim(p_search),'')='' or p.sku ilike '%'||btrim(p_search)||'%' or p."nameFa" ilike '%'||btrim(p_search)||'%' or p."nameEn" ilike '%'||btrim(p_search)||'%')
 ), scored as (
  select base.*,array_remove(array[case when not source_backed then 'SOURCE_EVIDENCE_MISSING' end,case when btrim(coalesce("nameFa",''))='' or btrim(coalesce("nameTr",''))='' or btrim(coalesce("nameEn",''))='' or btrim(coalesce("nameAr",''))='' then 'TRANSLATION_MISSING' end,case when not has_image then 'IMAGE_MISSING' end,case when has_variants then 'VARIANT_REVIEW_REQUIRED' end,case when coalesce(v_branch."isPublished",false)=false then 'BRANCH_NOT_PUBLISHED' end,case when coalesce(v_policy."salesEnabled",false)=false then 'SALES_DISABLED' end,case when coalesce(v_policy."paymentGateway",'DISABLED')<>'ZARINPAL' then 'GATEWAY_NOT_ZARINPAL' end,case when v_branch.currency<>'IRT' then 'CURRENCY_NOT_IRT' end,case when effective_price<=0 then 'PRICE_MISSING' end,case when available<=0 then 'STOCK_MISSING' end],null) blockers,array_remove(array[case when btrim(coalesce("descriptionFa",''))='' or btrim(coalesce("descriptionTr",''))='' or btrim(coalesce("descriptionEn",''))='' or btrim(coalesce("descriptionAr",''))='' then 'DESCRIPTION_MISSING' end],null) warnings
  from base
 ), final as (select *,cardinality(blockers)=0 ready_to_publish from scored)
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'sku',sku,'slug',slug,'nameFa',"nameFa",'nameTr',"nameTr",'nameEn',"nameEn",'nameAr',"nameAr",'published',"isPublished",'sourceBacked',source_backed,'hasImage',has_image,'hasVariants',has_variants,'effectivePrice',effective_price,'available',available,'readyToPublish',ready_to_publish,'blockers',to_jsonb(blockers),'warnings',to_jsonb(warnings)) order by "createdAt" desc),'[]'::jsonb),count(*),count(*) filter(where ready_to_publish),count(*) filter(where "isPublished") into v_products,v_total,v_ready,v_published from final;
 return jsonb_build_object('branch',jsonb_build_object('id',v_branch.id,'code',v_branch.code,'nameFa',v_branch."nameFa",'nameTr',v_branch."nameTr",'nameEn',v_branch."nameEn",'nameAr',v_branch."nameAr",'currency',v_branch.currency,'salesEnabled',coalesce(v_policy."salesEnabled",false),'paymentGateway',coalesce(v_policy."paymentGateway",'DISABLED')),'branches',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'code',code,'nameFa',"nameFa",'nameTr',"nameTr",'nameEn',"nameEn",'nameAr',"nameAr",'currency',currency) order by "isDefault" desc,code),'[]'::jsonb) from public."Branch" where "isPublished"=true),'summary',jsonb_build_object('total',v_total,'readyToPublish',v_ready,'published',v_published,'blocked',v_total-v_ready),'products',v_products);
end $$;

create or replace function public.admin_publish_catalog_ready_products(p_token text,p_branch_id text,p_product_ids jsonb default null)
returns jsonb
language plpgsql security definer set search_path='public','extensions'
as $$
declare v_admin public."AdminUser"%rowtype;v_readiness jsonb;v_ids text[];v_published_ids text[];v_count int:=0;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden';end if;
 if p_product_ids is not null and jsonb_typeof(p_product_ids)<>'array' then raise exception 'product ids must be an array';end if;
 v_readiness:=public.admin_catalog_launch_readiness(p_token,p_branch_id,null);
 select coalesce(array_agg(x->>'id'),'{}'::text[]) into v_ids from jsonb_array_elements(v_readiness->'products') x where coalesce((x->>'readyToPublish')::boolean,false)=true and coalesce((x->>'published')::boolean,false)=false and (p_product_ids is null or exists(select 1 from jsonb_array_elements_text(p_product_ids) s(value) where s.value=x->>'id'));
 if cardinality(v_ids)>0 then update public."Product" set "isPublished"=true,"updatedAt"=now() where id=any(v_ids) returning array_agg(id) over() into v_published_ids;get diagnostics v_count=row_count;end if;
 return jsonb_build_object('published',v_count,'productIds',to_jsonb(coalesce(v_ids,'{}'::text[])),'branchId',p_branch_id);
end $$;

revoke all on function public.admin_commerce_source_prepare(text,jsonb) from public,anon,authenticated;
revoke all on function public.admin_commerce_import_preflight(text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.admin_commerce_import_apply(text,text,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.admin_catalog_launch_readiness(text,text,text) from public,anon,authenticated;
revoke all on function public.admin_publish_catalog_ready_products(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_commerce_source_prepare(text,jsonb) to service_role;
grant execute on function public.admin_commerce_import_preflight(text,text,text,jsonb) to service_role;
grant execute on function public.admin_commerce_import_apply(text,text,text,jsonb,jsonb) to service_role;
grant execute on function public.admin_catalog_launch_readiness(text,text,text) to service_role;
grant execute on function public.admin_publish_catalog_ready_products(text,text,jsonb) to service_role;