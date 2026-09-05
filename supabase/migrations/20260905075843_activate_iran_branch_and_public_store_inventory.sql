insert into public."Branch"(id,code,"nameFa","nameTr","nameEn","nameAr","countryCode",currency,timezone,"isDefault","isPublished","createdAt","updatedAt")
select gen_random_uuid()::text,'IRAN','هایپر دکتر ایران','Hyper Doctor İran','Hyper Doctor Iran','هايبر دكتور إيران','IR','IRT','Asia/Tehran',true,true,now(),now()
where not exists(select 1 from public."Branch" where code='IRAN');

update public."Branch"
set "nameFa"='هایپر دکتر ایران',"nameTr"='Hyper Doctor İran',"nameEn"='Hyper Doctor Iran',"nameAr"='هايبر دكتور إيران',"countryCode"='IR',currency='IRT',timezone='Asia/Tehran',"isDefault"=true,"isPublished"=true,"updatedAt"=now()
where code='IRAN';
update public."Branch" set "isDefault"=false,"updatedAt"=now() where code<>'IRAN' and "isDefault"=true;

insert into public."Warehouse"(id,"branchId",code,"nameFa","nameTr","nameEn","nameAr","isActive","createdAt","updatedAt")
select gen_random_uuid()::text,b.id,'URMIA_MAIN','انبار مرکزی ارومیه','Urmiye Merkez Deposu','Urmia Main Warehouse','مستودع أورمية المركزي',true,now(),now()
from public."Branch" b
where b.code='IRAN' and not exists(select 1 from public."Warehouse" w where w."branchId"=b.id and w.code='URMIA_MAIN');

create or replace function public.public_checkout_locations()
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_result jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(x) order by x."isDefault" desc,x.code),'[]'::jsonb) into v_result
  from (
    select b.id,b.code,b."nameFa",b."nameTr",b."nameEn",b."nameAr",b."countryCode",b.currency,b.timezone,b."isDefault",
      (select count(*)::int from public."Warehouse" w where w."branchId"=b.id and w."isActive"=true) as "warehouseCount",
      coalesce((select sum(greatest(i."onHand"-i.reserved,0))::int from public."WarehouseInventory" i join public."Warehouse" w on w.id=i."warehouseId" where w."branchId"=b.id and w."isActive"=true),0)
      + coalesce((select sum(greatest(vi."onHand"-vi.reserved,0))::int from public."WarehouseVariantInventory" vi join public."Warehouse" w on w.id=vi."warehouseId" where w."branchId"=b.id and w."isActive"=true),0) as "sellableUnits"
    from public."Branch" b where b."isPublished"=true and exists(select 1 from public."Warehouse" w where w."branchId"=b.id and w."isActive"=true)
  ) x;
  return v_result;
end $$;

create or replace function public.public_store_inventory(p_branch_id text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_branch public."Branch"%rowtype; v_products jsonb; v_variants jsonb;
begin
  select * into v_branch from public."Branch" b
  where b."isPublished"=true and (nullif(btrim(coalesce(p_branch_id,'')),'') is null or b.id=p_branch_id)
    and exists(select 1 from public."Warehouse" w where w."branchId"=b.id and w."isActive"=true)
  order by case when b.id=p_branch_id then 0 else 1 end,b."isDefault" desc,b."createdAt" asc limit 1;
  if not found then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('productId',q."productId",'available',q.available) order by q."productId"),'[]'::jsonb) into v_products
  from (select i."productId",sum(greatest(i."onHand"-i.reserved,0))::int available from public."WarehouseInventory" i join public."Warehouse" w on w.id=i."warehouseId" join public."Product" p on p.id=i."productId" and p."isPublished"=true where w."branchId"=v_branch.id and w."isActive"=true group by i."productId") q;
  select coalesce(jsonb_agg(jsonb_build_object('variantId',q."variantId",'productId',q."productId",'available',q.available) order by q."variantId"),'[]'::jsonb) into v_variants
  from (select vi."variantId",vi."productId",sum(greatest(vi."onHand"-vi.reserved,0))::int available from public."WarehouseVariantInventory" vi join public."Warehouse" w on w.id=vi."warehouseId" join public."ProductVariant" pv on pv.id=vi."variantId" and pv."isPublished"=true join public."Product" p on p.id=vi."productId" and p."isPublished"=true where w."branchId"=v_branch.id and w."isActive"=true group by vi."variantId",vi."productId") q;
  return jsonb_build_object('branchId',v_branch.id,'branchCode',v_branch.code,'currency',v_branch.currency,'countryCode',v_branch."countryCode",'products',v_products,'variants',v_variants);
end $$;

revoke all on function public.public_checkout_locations() from public;
revoke all on function public.public_store_inventory(text) from public;
grant execute on function public.public_checkout_locations() to anon,authenticated;
grant execute on function public.public_store_inventory(text) to anon,authenticated;
