create table if not exists public."WarehouseVariantInventory" (
  "warehouseId" text not null references public."Warehouse"(id) on delete cascade,
  "variantId" text not null references public."ProductVariant"(id) on delete cascade,
  "productId" text not null references public."Product"(id) on delete cascade,
  "onHand" integer not null default 0 check ("onHand">=0),
  reserved integer not null default 0 check (reserved>=0 and reserved<="onHand"),
  "updatedAt" timestamptz not null default now(),
  primary key("warehouseId","variantId")
);
create index if not exists "WarehouseVariantInventory_productId_idx" on public."WarehouseVariantInventory"("productId");
create index if not exists "WarehouseVariantInventory_variantId_idx" on public."WarehouseVariantInventory"("variantId");
alter table public."WarehouseVariantInventory" enable row level security;
revoke all on public."WarehouseVariantInventory" from anon,authenticated;
alter table public."OrderItem" add column if not exists "inventoryReserved" boolean not null default false;

create or replace function public.admin_warehouse_variant_inventory(p_token text,p_warehouse_id text,p_product_id text default null,p_search text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype;v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden'; end if;
 if not exists(select 1 from public."Warehouse" where id=p_warehouse_id) then raise exception 'warehouse not found'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x."productNameEn",x."variantName",x.sku),'[]'::jsonb) into v_result from (
   select v.id as "variantId",v."productId",v.name as "variantName",v.sku,v.stock as "legacyStock",p."nameFa" as "productNameFa",p."nameTr" as "productNameTr",p."nameEn" as "productNameEn",p."nameAr" as "productNameAr",coalesce(i."onHand",0) as "onHand",coalesce(i.reserved,0) as reserved,greatest(coalesce(i."onHand",0)-coalesce(i.reserved,0),0) as available
   from public."ProductVariant" v join public."Product" p on p.id=v."productId"
   left join public."WarehouseVariantInventory" i on i."warehouseId"=p_warehouse_id and i."variantId"=v.id
   where (p_product_id is null or v."productId"=p_product_id) and (p_search is null or trim(p_search)='' or concat_ws(' ',v.sku,v.name,p.sku,p."nameFa",p."nameTr",p."nameEn",p."nameAr") ilike '%'||trim(p_search)||'%')
   order by p."nameEn",v.name,v.sku limit 1000
 ) x; return v_result;
end $$;
revoke all on function public.admin_warehouse_variant_inventory(text,text,text,text) from public;
grant execute on function public.admin_warehouse_variant_inventory(text,text,text,text) to anon,authenticated;

create or replace function public.admin_set_warehouse_variant_inventory(p_token text,p_warehouse_id text,p_variant_id text,p_on_hand integer,p_reserved integer default 0)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype;v_product_id text;v_total integer;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden'; end if;
 if p_on_hand<0 or p_reserved<0 or p_reserved>p_on_hand then raise exception 'invalid inventory values'; end if;
 if not exists(select 1 from public."Warehouse" where id=p_warehouse_id and "isActive"=true) then raise exception 'active warehouse not found'; end if;
 select "productId" into v_product_id from public."ProductVariant" where id=p_variant_id; if v_product_id is null then raise exception 'variant not found'; end if;
 insert into public."WarehouseVariantInventory"("warehouseId","variantId","productId","onHand",reserved,"updatedAt") values(p_warehouse_id,p_variant_id,v_product_id,p_on_hand,p_reserved,now())
 on conflict("warehouseId","variantId") do update set "productId"=excluded."productId","onHand"=excluded."onHand",reserved=excluded.reserved,"updatedAt"=now();
 select coalesce(sum(greatest(i."onHand"-i.reserved,0)),0)::integer into v_total from public."WarehouseVariantInventory" i join public."Warehouse" w on w.id=i."warehouseId" and w."isActive"=true where i."variantId"=p_variant_id;
 update public."ProductVariant" set stock=v_total,"updatedAt"=now() where id=p_variant_id; return true;
end $$;
revoke all on function public.admin_set_warehouse_variant_inventory(text,text,text,integer,integer) from public;
grant execute on function public.admin_set_warehouse_variant_inventory(text,text,text,integer,integer) to anon,authenticated;
