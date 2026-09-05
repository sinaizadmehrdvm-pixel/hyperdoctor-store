alter table public."Order" add column if not exists "branchId" text null references public."Branch"(id) on delete set null;
alter table public."OrderItem" add column if not exists "warehouseId" text null references public."Warehouse"(id) on delete set null;
create index if not exists "Order_branchId_idx" on public."Order"("branchId");
create index if not exists "OrderItem_warehouseId_idx" on public."OrderItem"("warehouseId");

create or replace function public.public_checkout_locations()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(x) order by x."isDefault" desc,x.code),'[]'::jsonb) into v_result
  from (
    select b.id,b.code,b."nameFa",b."nameTr",b."nameEn",b."nameAr",b."countryCode",b.currency,b.timezone,b."isDefault",
      count(distinct w.id)::int as "warehouseCount",coalesce(sum(greatest(i."onHand"-i.reserved,0)),0)::int as "sellableUnits"
    from public."Branch" b join public."Warehouse" w on w."branchId"=b.id and w."isActive"=true
    left join public."WarehouseInventory" i on i."warehouseId"=w.id
    where b."isPublished"=true group by b.id,b.code,b."nameFa",b."nameTr",b."nameEn",b."nameAr",b."countryCode",b.currency,b.timezone,b."isDefault"
    having count(distinct w.id)>0
  ) x; return v_result;
end $$;
revoke all on function public.public_checkout_locations() from public; grant execute on function public.public_checkout_locations() to anon,authenticated;

create or replace function public.create_guest_order_v2(p_request_token uuid,p_customer_name text,p_phone text,p_email text,p_address text,p_province text,p_city text,p_country text,p_postal_code text,p_notes text,p_locale text,p_lines jsonb,p_branch_id text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb;v_order_id text;v_item record;v_wh text;v_pending int;v_available int;v_existing_branch text;v_branch_id text;
begin
 v_branch_id:=nullif(btrim(coalesce(p_branch_id,'')),'');
 if v_branch_id is null then select b.id into v_branch_id from public."Branch" b where b."isPublished"=true and exists(select 1 from public."Warehouse" w where w."branchId"=b.id and w."isActive"=true) order by b."isDefault" desc,b."createdAt" asc limit 1; end if;
 if v_branch_id is null then return public.create_guest_order(p_request_token,p_customer_name,p_phone,p_email,p_address,p_province,p_city,p_country,p_postal_code,p_notes,p_locale,p_lines); end if;
 if not exists(select 1 from public."Branch" b where b.id=v_branch_id and b."isPublished"=true) then raise exception 'branch unavailable'; end if;
 if not exists(select 1 from public."Warehouse" w where w."branchId"=v_branch_id and w."isActive"=true) then raise exception 'branch has no active warehouse'; end if;
 v_result:=public.create_guest_order(p_request_token,p_customer_name,p_phone,p_email,p_address,p_province,p_city,p_country,p_postal_code,p_notes,p_locale,p_lines);v_order_id:=v_result->>'orderId';if v_order_id is null then raise exception 'order unavailable';end if;
 select "branchId" into v_existing_branch from public."Order" where id=v_order_id for update;if v_existing_branch is not null and v_existing_branch<>v_branch_id then raise exception 'order branch mismatch';end if;update public."Order" set "branchId"=v_branch_id,"updatedAt"=now() where id=v_order_id;
 for v_item in select oi.id,oi."productId",oi.quantity,oi."warehouseId" from public."OrderItem" oi where oi."orderId"=v_order_id and oi."productId" is not null order by oi.id loop
  if v_item."warehouseId" is not null then if not exists(select 1 from public."Warehouse" w where w.id=v_item."warehouseId" and w."branchId"=v_branch_id and w."isActive"=true) then raise exception 'order warehouse mismatch';end if;continue;end if;
  v_wh:=null;for v_wh,v_available in select w.id,greatest(i."onHand"-i.reserved,0)::int from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id and i."productId"=v_item."productId" where w."branchId"=v_branch_id and w."isActive"=true order by greatest(i."onHand"-i.reserved,0) desc,w.code loop
   select coalesce(sum(oi.quantity),0)::int into v_pending from public."OrderItem" oi join public."Order" o on o.id=oi."orderId" where oi."warehouseId"=v_wh and oi."productId"=v_item."productId" and oi.id<>v_item.id and o.status='PENDING_PAYMENT'::public."OrderStatus" and o."reservationExpiresAt">now();if v_available-v_pending>=v_item.quantity then exit;end if;v_wh:=null;
  end loop;if v_wh is null then raise exception 'insufficient branch inventory';end if;update public."OrderItem" set "warehouseId"=v_wh where id=v_item.id;
 end loop;return v_result||jsonb_build_object('branchId',v_branch_id);
end $$;
revoke all on function public.create_guest_order_v2(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text) from public;grant execute on function public.create_guest_order_v2(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text) to anon,authenticated;
