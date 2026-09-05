create or replace function public._location_product_available(p_product_id text)
returns integer language plpgsql stable security definer set search_path='public' as $$
declare v_total integer;
begin
  if exists(select 1 from public."WarehouseVariantInventory" where "productId"=p_product_id) then
    select coalesce(sum(greatest(i."onHand"-i.reserved,0)),0)::integer into v_total
    from public."WarehouseVariantInventory" i
    join public."Warehouse" w on w.id=i."warehouseId" and w."isActive"=true
    join public."Branch" b on b.id=w."branchId" and b."isPublished"=true
    where i."productId"=p_product_id;
  else
    select coalesce(sum(greatest(i."onHand"-i.reserved,0)),0)::integer into v_total
    from public."WarehouseInventory" i
    join public."Warehouse" w on w.id=i."warehouseId" and w."isActive"=true
    join public."Branch" b on b.id=w."branchId" and b."isPublished"=true
    where i."productId"=p_product_id;
  end if;
  return coalesce(v_total,0);
end $$;

create or replace function public._enforce_product_location_stock()
returns trigger language plpgsql security definer set search_path='public' as $$
begin
  if exists(select 1 from public."WarehouseInventory" where "productId"=new.id)
     or exists(select 1 from public."WarehouseVariantInventory" where "productId"=new.id) then
    new.stock:=public._location_product_available(new.id);
  end if;
  return new;
end $$;

create or replace function public._sync_variant_location_stock_from_inventory()
returns trigger language plpgsql security definer set search_path='public' as $$
declare v_variant_id text:=coalesce(new."variantId",old."variantId");v_product_id text:=coalesce(new."productId",old."productId");
begin
  update public."ProductVariant" set stock=public._location_variant_available(v_variant_id),"updatedAt"=now() where id=v_variant_id;
  update public."Product" set stock=public._location_product_available(v_product_id),"updatedAt"=now() where id=v_product_id;
  return coalesce(new,old);
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
  from (
    with ids as (
      select i."productId" from public."WarehouseInventory" i join public."Warehouse" w on w.id=i."warehouseId" where w."branchId"=v_branch.id and w."isActive"=true
      union
      select i."productId" from public."WarehouseVariantInventory" i join public."Warehouse" w on w.id=i."warehouseId" where w."branchId"=v_branch.id and w."isActive"=true
    )
    select ids."productId",
      case when exists(select 1 from public."WarehouseVariantInventory" vi join public."Warehouse" w on w.id=vi."warehouseId" where vi."productId"=ids."productId" and w."branchId"=v_branch.id and w."isActive"=true)
      then coalesce((select sum(greatest(vi."onHand"-vi.reserved,0))::int from public."WarehouseVariantInventory" vi join public."Warehouse" w on w.id=vi."warehouseId" where vi."productId"=ids."productId" and w."branchId"=v_branch.id and w."isActive"=true),0)
      else coalesce((select sum(greatest(i."onHand"-i.reserved,0))::int from public."WarehouseInventory" i join public."Warehouse" w on w.id=i."warehouseId" where i."productId"=ids."productId" and w."branchId"=v_branch.id and w."isActive"=true),0) end as available
    from ids join public."Product" p on p.id=ids."productId" and p."isPublished"=true
  ) q;

  select coalesce(jsonb_agg(jsonb_build_object('variantId',q."variantId",'productId',q."productId",'available',q.available) order by q."variantId"),'[]'::jsonb) into v_variants
  from (
    select vi."variantId",vi."productId",sum(greatest(vi."onHand"-vi.reserved,0))::int available
    from public."WarehouseVariantInventory" vi
    join public."Warehouse" w on w.id=vi."warehouseId" and w."isActive"=true
    join public."ProductVariant" pv on pv.id=vi."variantId" and pv."isPublished"=true
    join public."Product" p on p.id=vi."productId" and p."isPublished"=true
    where w."branchId"=v_branch.id group by vi."variantId",vi."productId"
  ) q;
  return jsonb_build_object('branchId',v_branch.id,'branchCode',v_branch.code,'currency',v_branch.currency,'countryCode',v_branch."countryCode",'products',v_products,'variants',v_variants);
end $$;

revoke all on function public._location_product_available(text) from public,anon,authenticated;
revoke all on function public._enforce_product_location_stock() from public,anon,authenticated;
revoke all on function public._sync_variant_location_stock_from_inventory() from public,anon,authenticated;
revoke all on function public.public_store_inventory(text) from public;
grant execute on function public.public_store_inventory(text) to anon,authenticated;
