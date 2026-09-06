create table if not exists public."ProductMediaEvidence" (
  id text primary key,
  "productId" text not null references public."Product"(id) on delete cascade,
  "mediaId" text not null unique references public."Media"(id) on delete cascade,
  "sourceType" text not null,
  "sourceReference" text not null,
  "sourceModel" text not null,
  notes text not null default '',
  "verificationStatus" text not null default 'VERIFIED',
  "createdBy" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint product_media_evidence_source_type_chk check ("sourceType" in ('CATALOG','BRAND_SITE','SUPPLIER_FILE','ADMIN_UPLOAD','OTHER')),
  constraint product_media_evidence_status_chk check ("verificationStatus" in ('VERIFIED','REJECTED'))
);
create index if not exists product_media_evidence_product_idx on public."ProductMediaEvidence"("productId");
alter table public."ProductMediaEvidence" enable row level security;
revoke all on table public."ProductMediaEvidence" from public, anon, authenticated;
grant select,insert,update,delete on table public."ProductMediaEvidence" to service_role;

create or replace function public.admin_product_media_workspace(p_token text,p_product_id text,p_search text default null)
returns jsonb language plpgsql security definer set search_path='public','extensions' as $$
declare v_admin public."AdminUser"%rowtype;v_product public."Product"%rowtype;v_attached jsonb;v_available jsonb;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden';end if;
 select * into v_product from public."Product" where id=p_product_id;if not found then raise exception 'product not found';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'url',m.url,'altFa',m."altFa",'altTr',m."altTr",'altEn',m."altEn",'altAr',m."altAr",'sortOrder',m."sortOrder",'evidence',case when e.id is null then null else jsonb_build_object('id',e.id,'sourceType',e."sourceType",'sourceReference',e."sourceReference",'sourceModel',e."sourceModel",'notes',e.notes,'verificationStatus',e."verificationStatus",'createdAt',e."createdAt") end) order by m."sortOrder",m."createdAt"),'[]'::jsonb) into v_attached
 from public."Media" m left join public."ProductMediaEvidence" e on e."mediaId"=m.id where m."productId"=p_product_id;
 select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'url',m.url,'altFa',m."altFa",'altTr',m."altTr",'altEn',m."altEn",'altAr',m."altAr",'createdAt',m."createdAt") order by m."createdAt" desc),'[]'::jsonb) into v_available
 from (select * from public."Media" where "productId" is null and (coalesce(btrim(p_search),'')='' or url ilike '%'||btrim(p_search)||'%' or "altFa" ilike '%'||btrim(p_search)||'%' or "altEn" ilike '%'||btrim(p_search)||'%') order by "createdAt" desc limit 100) m;
 return jsonb_build_object('product',jsonb_build_object('id',v_product.id,'sku',v_product.sku,'modelNumber',v_product."modelNumber",'nameFa',v_product."nameFa",'nameTr',v_product."nameTr",'nameEn',v_product."nameEn",'nameAr',v_product."nameAr",'isPublished',v_product."isPublished"),'attached',v_attached,'available',v_available,'verifiedCount',(select count(*) from public."ProductMediaEvidence" e join public."Media" m on m.id=e."mediaId" and m."productId"=p_product_id where e."productId"=p_product_id and e."verificationStatus"='VERIFIED'));
end $$;

create or replace function public.admin_attach_verified_product_media(p_token text,p_product_id text,p_media_id text,p_source_type text,p_source_reference text,p_source_model text,p_notes text default '')
returns jsonb language plpgsql security definer set search_path='public','extensions' as $$
declare v_admin public."AdminUser"%rowtype;v_product public."Product"%rowtype;v_media public."Media"%rowtype;v_id text;v_sort int;v_type text:=upper(btrim(coalesce(p_source_type,'')));v_ref text:=btrim(coalesce(p_source_reference,''));v_model text:=btrim(coalesce(p_source_model,''));
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden';end if;
 select * into v_product from public."Product" where id=p_product_id;if not found then raise exception 'product not found';end if;
 select * into v_media from public."Media" where id=p_media_id;if not found then raise exception 'media not found';end if;
 if v_media."productId" is not null and v_media."productId"<>p_product_id then raise exception 'media belongs to another product';end if;
 if coalesce(btrim(v_media.url),'')='' or not (v_media.url like '/%' or v_media.url ~* '^https://') then raise exception 'media url must be HTTPS or local';end if;
 if v_type not in ('CATALOG','BRAND_SITE','SUPPLIER_FILE','ADMIN_UPLOAD','OTHER') then raise exception 'invalid media source type';end if;
 if v_ref='' then raise exception 'source reference required';end if;
 if v_model='' then raise exception 'source model required';end if;
 if lower(v_model)<>lower(coalesce(v_product."modelNumber",'')) and lower(v_model)<>lower(coalesce(v_product.sku,'')) then raise exception 'source model must match product model or SKU';end if;
 select coalesce(max("sortOrder"),-1)+1 into v_sort from public."Media" where "productId"=p_product_id;
 update public."Media" set "productId"=p_product_id,"sortOrder"=case when "productId" is null then v_sort else "sortOrder" end,"altFa"=case when btrim(coalesce("altFa",''))='' then coalesce(v_product."nameFa",'') else "altFa" end,"altTr"=case when btrim(coalesce("altTr",''))='' then coalesce(v_product."nameTr",'') else "altTr" end,"altEn"=case when btrim(coalesce("altEn",''))='' then coalesce(v_product."nameEn",'') else "altEn" end,"altAr"=case when btrim(coalesce("altAr",''))='' then coalesce(v_product."nameAr",'') else "altAr" end where id=p_media_id;
 select id into v_id from public."ProductMediaEvidence" where "mediaId"=p_media_id;
 if v_id is null then v_id:=replace(gen_random_uuid()::text,'-','');insert into public."ProductMediaEvidence"(id,"productId","mediaId","sourceType","sourceReference","sourceModel",notes,"verificationStatus","createdBy") values(v_id,p_product_id,p_media_id,v_type,v_ref,v_model,left(coalesce(p_notes,''),1000),'VERIFIED',v_admin.id);
 else update public."ProductMediaEvidence" set "productId"=p_product_id,"sourceType"=v_type,"sourceReference"=v_ref,"sourceModel"=v_model,notes=left(coalesce(p_notes,''),1000),"verificationStatus"='VERIFIED',"updatedAt"=now() where id=v_id;end if;
 return jsonb_build_object('id',v_id,'mediaId',p_media_id,'productId',p_product_id,'verified',true);
end $$;

create or replace function public.admin_detach_verified_product_media(p_token text,p_product_id text,p_media_id text)
returns boolean language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype;v_published boolean;v_verified int;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden';end if;
 select "isPublished" into v_published from public."Product" where id=p_product_id;if not found then raise exception 'product not found';end if;
 select count(*) into v_verified from public."ProductMediaEvidence" e join public."Media" m on m.id=e."mediaId" where e."productId"=p_product_id and e."verificationStatus"='VERIFIED' and m."productId"=p_product_id;
 if v_published and v_verified<=1 then raise exception 'cannot remove the last verified image from a published product';end if;
 delete from public."ProductMediaEvidence" where "productId"=p_product_id and "mediaId"=p_media_id;
 update public."Media" set "productId"=null,"sortOrder"=0 where id=p_media_id and "productId"=p_product_id;
 return found;
end $$;

create or replace function public.admin_catalog_launch_readiness(p_token text,p_branch_id text default null,p_search text default null)
returns jsonb language plpgsql security definer set search_path='public','extensions' as $$
declare v_admin public."AdminUser"%rowtype;v_branch public."Branch"%rowtype;v_policy public."BranchCommercePolicy"%rowtype;v_products jsonb;v_total int;v_ready int;v_published int;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden';end if;
 if nullif(btrim(coalesce(p_branch_id,'')),'') is null then select * into v_branch from public."Branch" where "isDefault"=true and "isPublished"=true order by "createdAt" limit 1;else select * into v_branch from public."Branch" where id=p_branch_id and "isPublished"=true;end if;if not found then raise exception 'published branch not found';end if;
 select * into v_policy from public."BranchCommercePolicy" where "branchId"=v_branch.id;
 with base as (
  select p.*,exists(select 1 from public."ProductSourceEvidence" e where e."productId"=p.id) source_backed,exists(select 1 from public."Media" m join public."ProductMediaEvidence" me on me."mediaId"=m.id and me."productId"=p.id and me."verificationStatus"='VERIFIED' where m."productId"=p.id and btrim(coalesce(m.url,''))<>'') has_verified_image,exists(select 1 from public."ProductVariant" pv where pv."productId"=p.id) has_variants,coalesce((select bpp.price from public."BranchProductPrice" bpp where bpp."branchId"=v_branch.id and bpp."productId"=p.id and bpp."isActive"=true),p.price,0) effective_price,coalesce((select sum(greatest(wi."onHand"-wi.reserved-wi."rentalUnits",0)) from public."WarehouseInventory" wi join public."Warehouse" w on w.id=wi."warehouseId" and w."branchId"=v_branch.id and w."isActive"=true where wi."productId"=p.id),0)::int available
  from public."Product" p where (coalesce(btrim(p_search),'')='' or p.sku ilike '%'||btrim(p_search)||'%' or p."nameFa" ilike '%'||btrim(p_search)||'%' or p."nameEn" ilike '%'||btrim(p_search)||'%')
 ), scored as (
  select base.*,array_remove(array[case when not source_backed then 'SOURCE_EVIDENCE_MISSING' end,case when btrim(coalesce("nameFa",''))='' or btrim(coalesce("nameTr",''))='' or btrim(coalesce("nameEn",''))='' or btrim(coalesce("nameAr",''))='' then 'TRANSLATION_MISSING' end,case when not has_verified_image then 'VERIFIED_IMAGE_MISSING' end,case when has_variants then 'VARIANT_REVIEW_REQUIRED' end,case when coalesce(v_branch."isPublished",false)=false then 'BRANCH_NOT_PUBLISHED' end,case when coalesce(v_policy."salesEnabled",false)=false then 'SALES_DISABLED' end,case when coalesce(v_policy."paymentGateway",'DISABLED')<>'ZARINPAL' then 'GATEWAY_NOT_ZARINPAL' end,case when v_branch.currency<>'IRT' then 'CURRENCY_NOT_IRT' end,case when effective_price<=0 then 'PRICE_MISSING' end,case when available<=0 then 'STOCK_MISSING' end],null) blockers,array_remove(array[case when btrim(coalesce("descriptionFa",''))='' or btrim(coalesce("descriptionTr",''))='' or btrim(coalesce("descriptionEn",''))='' or btrim(coalesce("descriptionAr",''))='' then 'DESCRIPTION_MISSING' end],null) warnings from base
 ), final as (select *,cardinality(blockers)=0 ready_to_publish from scored)
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'sku',sku,'slug',slug,'nameFa',"nameFa",'nameTr',"nameTr",'nameEn',"nameEn",'nameAr',"nameAr",'published',"isPublished",'sourceBacked',source_backed,'hasImage',has_verified_image,'hasVerifiedImage',has_verified_image,'hasVariants',has_variants,'effectivePrice',effective_price,'available',available,'readyToPublish',ready_to_publish,'blockers',to_jsonb(blockers),'warnings',to_jsonb(warnings)) order by "createdAt" desc),'[]'::jsonb),count(*),count(*) filter(where ready_to_publish),count(*) filter(where "isPublished") into v_products,v_total,v_ready,v_published from final;
 return jsonb_build_object('branch',jsonb_build_object('id',v_branch.id,'code',v_branch.code,'nameFa',v_branch."nameFa",'nameTr',v_branch."nameTr",'nameEn',v_branch."nameEn",'nameAr',v_branch."nameAr",'currency',v_branch.currency,'salesEnabled',coalesce(v_policy."salesEnabled",false),'paymentGateway',coalesce(v_policy."paymentGateway",'DISABLED')),'branches',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'code',code,'nameFa',"nameFa",'nameTr',"nameTr",'nameEn',"nameEn",'nameAr',"nameAr",'currency',currency) order by "isDefault" desc,code),'[]'::jsonb) from public."Branch" where "isPublished"=true),'summary',jsonb_build_object('total',v_total,'readyToPublish',v_ready,'published',v_published,'blocked',v_total-v_ready),'products',v_products);
end $$;

create or replace function public.admin_publish_catalog_ready_products(p_token text,p_branch_id text,p_product_ids jsonb default null)
returns jsonb language plpgsql security definer set search_path='public','extensions' as $$
declare v_admin public."AdminUser"%rowtype;v_readiness jsonb;v_ids text[];v_count int:=0;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden';end if;
 if p_product_ids is not null and jsonb_typeof(p_product_ids)<>'array' then raise exception 'product ids must be an array';end if;
 v_readiness:=public.admin_catalog_launch_readiness(p_token,p_branch_id,null);
 select coalesce(array_agg(x->>'id'),'{}'::text[]) into v_ids from jsonb_array_elements(v_readiness->'products') x where coalesce((x->>'readyToPublish')::boolean,false)=true and coalesce((x->>'published')::boolean,false)=false and (p_product_ids is null or exists(select 1 from jsonb_array_elements_text(p_product_ids) s(value) where s.value=x->>'id'));
 if cardinality(v_ids)>0 then update public."Product" set "isPublished"=true,"updatedAt"=now() where id=any(v_ids);get diagnostics v_count=row_count;end if;
 return jsonb_build_object('published',v_count,'productIds',to_jsonb(coalesce(v_ids,'{}'::text[])),'branchId',p_branch_id);
end $$;

create or replace function public.admin_product_commerce_readiness(p_token text,p_id text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype;v_product public."Product"%rowtype;v_images integer:=0;v_variants integer:=0;v_catalog_ready boolean:=false;v_branches jsonb:='[]'::jsonb;v_any_sale_ready boolean:=false;v_any_checkout_ready boolean:=false;v_branch record;v_price integer;v_stock integer;v_ready_variants integer;v_reasons jsonb;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden';end if;select * into v_product from public."Product" where id=p_id;if not found then raise exception 'product not found';end if;
 select count(*)::integer into v_images from public."Media" m join public."ProductMediaEvidence" e on e."mediaId"=m.id and e."productId"=p_id and e."verificationStatus"='VERIFIED' where m."productId"=p_id and btrim(coalesce(m.url,''))<>'';
 select count(*)::integer into v_variants from public."ProductVariant" where "productId"=p_id and "isPublished"=true;
 v_catalog_ready:=btrim(coalesce(v_product."nameFa",''))<>'' and btrim(coalesce(v_product."nameTr",''))<>'' and btrim(coalesce(v_product."nameEn",''))<>'' and btrim(coalesce(v_product."nameAr",''))<>'' and btrim(coalesce(v_product.sku,''))<>'' and btrim(coalesce(v_product.slug,''))<>'' and v_images>0;
 for v_branch in select b.id,b.code,b.currency,b."nameFa",b."nameTr",b."nameEn",b."nameAr",coalesce(cp."salesEnabled",false) sales_enabled,coalesce(cp."paymentGateway",'DISABLED') gateway from public."Branch" b left join public."BranchCommercePolicy" cp on cp."branchId"=b.id where b."isPublished"=true order by b."isDefault" desc,b."createdAt" loop
  v_price:=null;v_stock:=0;v_ready_variants:=0;v_reasons:='[]'::jsonb;
  if v_variants>0 then select count(*)::integer,coalesce(sum(x.available),0)::integer,min(x.effective_price) filter(where x.effective_price>0) into v_ready_variants,v_stock,v_price from (select pv.id,coalesce((select bp.price from public."BranchVariantPrice" bp where bp."branchId"=v_branch.id and bp."variantId"=pv.id and bp."isActive"=true),(select pp.price from public."BranchProductPrice" pp where pp."branchId"=v_branch.id and pp."productId"=p_id and pp."isActive"=true),pv.price,v_product.price) effective_price,coalesce((select sum(greatest(i."onHand"-i.reserved,0))::integer from public."Warehouse" w join public."WarehouseVariantInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch.id and w."isActive"=true and i."productId"=p_id and i."variantId"=pv.id),0) available from public."ProductVariant" pv where pv."productId"=p_id and pv."isPublished"=true) x where x.effective_price>0 and x.available>0;
  else select coalesce((select pp.price from public."BranchProductPrice" pp where pp."branchId"=v_branch.id and pp."productId"=p_id and pp."isActive"=true),v_product.price) into v_price;select coalesce(sum(greatest(i."onHand"-i.reserved,0)),0)::integer into v_stock from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch.id and w."isActive"=true and i."productId"=p_id;end if;
  if not v_product."isPublished" then v_reasons:=v_reasons||'"NOT_PUBLISHED"'::jsonb;end if;if v_images=0 then v_reasons:=v_reasons||'"VERIFIED_IMAGE_MISSING"'::jsonb;end if;if not v_branch.sales_enabled then v_reasons:=v_reasons||'"SALES_DISABLED"'::jsonb;end if;if v_variants>0 then if v_ready_variants=0 then v_reasons:=v_reasons||'"NO_READY_VARIANT"'::jsonb;end if;else if coalesce(v_price,0)<=0 then v_reasons:=v_reasons||'"PRICE_UNAVAILABLE"'::jsonb;end if;if v_stock<=0 then v_reasons:=v_reasons||'"OUT_OF_STOCK"'::jsonb;end if;end if;
  v_any_sale_ready:=v_any_sale_ready or (v_product."isPublished" and v_images>0 and v_branch.sales_enabled and case when v_variants>0 then v_ready_variants>0 else coalesce(v_price,0)>0 and v_stock>0 end);v_any_checkout_ready:=v_any_checkout_ready or (v_product."isPublished" and v_images>0 and v_branch.sales_enabled and v_branch.gateway='ZARINPAL' and v_branch.currency='IRT' and case when v_variants>0 then v_ready_variants>0 else coalesce(v_price,0)>0 and v_stock>0 end);
  v_branches:=v_branches||jsonb_build_array(jsonb_build_object('branchId',v_branch.id,'branchCode',v_branch.code,'nameFa',v_branch."nameFa",'nameTr',v_branch."nameTr",'nameEn',v_branch."nameEn",'nameAr',v_branch."nameAr",'currency',v_branch.currency,'salesEnabled',v_branch.sales_enabled,'paymentGateway',v_branch.gateway,'price',v_price,'available',v_stock,'publishedVariants',v_variants,'readyVariants',v_ready_variants,'saleReady',v_product."isPublished" and v_images>0 and v_branch.sales_enabled and case when v_variants>0 then v_ready_variants>0 else coalesce(v_price,0)>0 and v_stock>0 end,'checkoutReady',v_product."isPublished" and v_images>0 and v_branch.sales_enabled and v_branch.gateway='ZARINPAL' and v_branch.currency='IRT' and case when v_variants>0 then v_ready_variants>0 else coalesce(v_price,0)>0 and v_stock>0 end,'reasons',v_reasons));
 end loop;return jsonb_build_object('productId',p_id,'isPublished',v_product."isPublished",'imageCount',v_images,'verifiedImageCount',v_images,'publishedVariants',v_variants,'catalogReady',v_catalog_ready,'saleReadyAnyBranch',v_any_sale_ready,'checkoutReadyAnyBranch',v_any_checkout_ready,'branches',v_branches);
end $$;

revoke all on function public.admin_product_media_workspace(text,text,text) from public,anon,authenticated;grant execute on function public.admin_product_media_workspace(text,text,text) to service_role;
revoke all on function public.admin_attach_verified_product_media(text,text,text,text,text,text,text) from public,anon,authenticated;grant execute on function public.admin_attach_verified_product_media(text,text,text,text,text,text,text) to service_role;
revoke all on function public.admin_detach_verified_product_media(text,text,text) from public,anon,authenticated;grant execute on function public.admin_detach_verified_product_media(text,text,text) to service_role;
revoke all on function public.admin_catalog_launch_readiness(text,text,text) from public,anon,authenticated;grant execute on function public.admin_catalog_launch_readiness(text,text,text) to service_role;
revoke all on function public.admin_publish_catalog_ready_products(text,text,jsonb) from public,anon,authenticated;grant execute on function public.admin_publish_catalog_ready_products(text,text,jsonb) to service_role;
revoke all on function public.admin_product_commerce_readiness(text,text) from public,anon,authenticated;grant execute on function public.admin_product_commerce_readiness(text,text) to service_role;
