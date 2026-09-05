create or replace function public._location_product_available(p_product_id text)
returns integer language sql stable security definer set search_path='public' as $$
  select coalesce(sum(greatest(i."onHand"-i.reserved,0)),0)::integer
  from public."WarehouseInventory" i
  join public."Warehouse" w on w.id=i."warehouseId" and w."isActive"=true
  join public."Branch" b on b.id=w."branchId" and b."isPublished"=true
  where i."productId"=p_product_id
$$;
create or replace function public._location_variant_available(p_variant_id text)
returns integer language sql stable security definer set search_path='public' as $$
  select coalesce(sum(greatest(i."onHand"-i.reserved,0)),0)::integer
  from public."WarehouseVariantInventory" i
  join public."Warehouse" w on w.id=i."warehouseId" and w."isActive"=true
  join public."Branch" b on b.id=w."branchId" and b."isPublished"=true
  where i."variantId"=p_variant_id
$$;
create or replace function public._enforce_product_location_stock()
returns trigger language plpgsql security definer set search_path='public' as $$ begin if exists(select 1 from public."WarehouseInventory" where "productId"=new.id) then new.stock:=public._location_product_available(new.id); end if; return new; end $$;
create or replace function public._enforce_variant_location_stock()
returns trigger language plpgsql security definer set search_path='public' as $$ begin if exists(select 1 from public."WarehouseVariantInventory" where "variantId"=new.id) then new.stock:=public._location_variant_available(new.id); end if; return new; end $$;
create or replace function public._sync_product_location_stock_from_inventory()
returns trigger language plpgsql security definer set search_path='public' as $$ declare v_product_id text:=coalesce(new."productId",old."productId"); begin update public."Product" set stock=public._location_product_available(v_product_id),"updatedAt"=now() where id=v_product_id; return coalesce(new,old); end $$;
create or replace function public._sync_variant_location_stock_from_inventory()
returns trigger language plpgsql security definer set search_path='public' as $$ declare v_variant_id text:=coalesce(new."variantId",old."variantId"); begin update public."ProductVariant" set stock=public._location_variant_available(v_variant_id),"updatedAt"=now() where id=v_variant_id; return coalesce(new,old); end $$;
drop trigger if exists trg_product_location_stock_guard on public."Product";
create trigger trg_product_location_stock_guard before update of stock on public."Product" for each row execute function public._enforce_product_location_stock();
drop trigger if exists trg_variant_location_stock_guard on public."ProductVariant";
create trigger trg_variant_location_stock_guard before update of stock on public."ProductVariant" for each row execute function public._enforce_variant_location_stock();
drop trigger if exists trg_warehouse_inventory_sync_stock on public."WarehouseInventory";
create trigger trg_warehouse_inventory_sync_stock after insert or update of "onHand",reserved or delete on public."WarehouseInventory" for each row execute function public._sync_product_location_stock_from_inventory();
drop trigger if exists trg_warehouse_variant_inventory_sync_stock on public."WarehouseVariantInventory";
create trigger trg_warehouse_variant_inventory_sync_stock after insert or update of "onHand",reserved or delete on public."WarehouseVariantInventory" for each row execute function public._sync_variant_location_stock_from_inventory();
create or replace function public._resync_location_stock_for_warehouse()
returns trigger language plpgsql security definer set search_path='public' as $$ declare r record; begin if old."isActive" is distinct from new."isActive" or old."branchId" is distinct from new."branchId" then for r in select distinct "productId" id from public."WarehouseInventory" where "warehouseId"=new.id loop update public."Product" set stock=public._location_product_available(r.id),"updatedAt"=now() where id=r.id; end loop; for r in select distinct "variantId" id from public."WarehouseVariantInventory" where "warehouseId"=new.id loop update public."ProductVariant" set stock=public._location_variant_available(r.id),"updatedAt"=now() where id=r.id; end loop; end if; return new; end $$;
drop trigger if exists trg_warehouse_resync_stock on public."Warehouse";
create trigger trg_warehouse_resync_stock after update of "isActive","branchId" on public."Warehouse" for each row execute function public._resync_location_stock_for_warehouse();
create or replace function public._resync_location_stock_for_branch()
returns trigger language plpgsql security definer set search_path='public' as $$ declare r record; begin if old."isPublished" is distinct from new."isPublished" then for r in select distinct i."productId" id from public."WarehouseInventory" i join public."Warehouse" w on w.id=i."warehouseId" where w."branchId"=new.id loop update public."Product" set stock=public._location_product_available(r.id),"updatedAt"=now() where id=r.id; end loop; for r in select distinct i."variantId" id from public."WarehouseVariantInventory" i join public."Warehouse" w on w.id=i."warehouseId" where w."branchId"=new.id loop update public."ProductVariant" set stock=public._location_variant_available(r.id),"updatedAt"=now() where id=r.id; end loop; end if; return new; end $$;
drop trigger if exists trg_branch_resync_stock on public."Branch";
create trigger trg_branch_resync_stock after update of "isPublished" on public."Branch" for each row execute function public._resync_location_stock_for_branch();
revoke all on function public._location_product_available(text) from public,anon,authenticated;
revoke all on function public._location_variant_available(text) from public,anon,authenticated;
revoke all on function public._enforce_product_location_stock() from public,anon,authenticated;
revoke all on function public._enforce_variant_location_stock() from public,anon,authenticated;
revoke all on function public._sync_product_location_stock_from_inventory() from public,anon,authenticated;
revoke all on function public._sync_variant_location_stock_from_inventory() from public,anon,authenticated;
revoke all on function public._resync_location_stock_for_warehouse() from public,anon,authenticated;
revoke all on function public._resync_location_stock_for_branch() from public,anon,authenticated;
