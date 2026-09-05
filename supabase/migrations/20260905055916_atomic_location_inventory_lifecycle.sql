create or replace function public._release_order_location_reservations(p_order_id text)
returns void language plpgsql security definer set search_path=public as $$
declare v_item record;
begin
 for v_item in select oi.id,oi."productId",oi."variantId",oi."warehouseId",oi.quantity from public."OrderItem" oi where oi."orderId"=p_order_id and oi."inventoryReserved"=true order by oi.id for update loop
   if v_item."warehouseId" is null then raise exception 'reserved order item missing warehouse'; end if;
   if v_item."variantId" is not null then update public."WarehouseVariantInventory" set reserved=greatest(reserved-v_item.quantity,0),"updatedAt"=now() where "warehouseId"=v_item."warehouseId" and "variantId"=v_item."variantId";
   else update public."WarehouseInventory" set reserved=greatest(reserved-v_item.quantity,0),"updatedAt"=now() where "warehouseId"=v_item."warehouseId" and "productId"=v_item."productId"; end if;
   update public."OrderItem" set "inventoryReserved"=false where id=v_item.id;
 end loop;
end $$;
revoke all on function public._release_order_location_reservations(text) from public,anon,authenticated;

create or replace function public._expire_pending_location_orders()
returns integer language plpgsql security definer set search_path=public as $$
declare v_order record;v_count integer:=0;
begin
 for v_order in select o.id from public."Order" o where o.status='PENDING_PAYMENT'::public."OrderStatus" and o."branchId" is not null and o."reservationExpiresAt" is not null and o."reservationExpiresAt"<=now() order by o."reservationExpiresAt" for update skip locked loop
   perform public._release_order_location_reservations(v_order.id);
   update public."Order" set status='FAILED'::public."OrderStatus","reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id and status='PENDING_PAYMENT'::public."OrderStatus";
   if found then v_count:=v_count+1; end if;
 end loop; return v_count;
end $$;
revoke all on function public._expire_pending_location_orders() from public,anon,authenticated;

create or replace function public.cancel_guest_order_v2(p_order_number text,p_checkout_token uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_order public."Order"%rowtype;
begin
 select * into v_order from public."Order" where "orderNumber"=p_order_number and "checkoutToken"=p_checkout_token for update;
 if not found or v_order.status<>'PENDING_PAYMENT'::public."OrderStatus" or v_order."paymentAuthority" is not null then return false; end if;
 if v_order."branchId" is not null then perform public._release_order_location_reservations(v_order.id); end if;
 update public."Order" set status='FAILED'::public."OrderStatus","checkoutToken"=null,"reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id; return true;
end $$;
revoke all on function public.cancel_guest_order_v2(text,uuid) from public;
grant execute on function public.cancel_guest_order_v2(text,uuid) to anon,authenticated;

create or replace function public.finalize_order_payment_v2(p_order_number text,p_checkout_token uuid,p_authority text,p_success boolean,p_ref_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_order public."Order"%rowtype;v_item record;v_conflict boolean:=false;
begin
 select * into v_order from public."Order" where "orderNumber"=p_order_number and "checkoutToken"=p_checkout_token and "paymentAuthority"=p_authority for update; if not found then return null; end if;
 if v_order."branchId" is null then return public.finalize_order_payment(p_order_number,p_checkout_token,p_authority,p_success,p_ref_id); end if;
 if v_order.status in ('PAID'::public."OrderStatus",'PROCESSING'::public."OrderStatus",'SHIPPED'::public."OrderStatus",'COMPLETED'::public."OrderStatus",'FAILED'::public."OrderStatus",'CANCELLED'::public."OrderStatus",'REFUNDED'::public."OrderStatus",'PAYMENT_REVIEW'::public."OrderStatus") then return jsonb_build_object('orderNumber',v_order."orderNumber",'status',v_order.status::text,'locale',v_order.locale,'resultToken',v_order."resultToken"); end if;
 if v_order.status<>'PENDING_PAYMENT'::public."OrderStatus" then return jsonb_build_object('orderNumber',v_order."orderNumber",'status',v_order.status::text,'locale',v_order.locale,'resultToken',v_order."resultToken"); end if;
 if not p_success then perform public._release_order_location_reservations(v_order.id);update public."Order" set status='FAILED'::public."OrderStatus","reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;return jsonb_build_object('orderNumber',v_order."orderNumber",'status','FAILED','locale',v_order.locale,'resultToken',v_order."resultToken"); end if;
 if p_ref_id is null or char_length(btrim(p_ref_id))<1 or char_length(btrim(p_ref_id))>128 then raise exception 'valid payment reference required'; end if;
 for v_item in select oi.id,oi."productId",oi."variantId",oi."warehouseId",oi.quantity,oi."inventoryReserved" from public."OrderItem" oi where oi."orderId"=v_order.id and oi."productId" is not null order by oi.id for update loop
   if not v_item."inventoryReserved" or v_item."warehouseId" is null or v_item.quantity<1 then v_conflict:=true;exit;end if;
   if v_item."variantId" is not null then perform 1 from public."WarehouseVariantInventory" i where i."warehouseId"=v_item."warehouseId" and i."variantId"=v_item."variantId" and i."productId"=v_item."productId" and i.reserved>=v_item.quantity and i."onHand">=v_item.quantity for update;
   else perform 1 from public."WarehouseInventory" i where i."warehouseId"=v_item."warehouseId" and i."productId"=v_item."productId" and i.reserved>=v_item.quantity and i."onHand">=v_item.quantity for update; end if;
   if not found then v_conflict:=true;exit;end if;
 end loop;
 if v_conflict then update public."Order" set status='PAYMENT_REVIEW'::public."OrderStatus","paymentRefId"=btrim(p_ref_id),"reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;return jsonb_build_object('orderNumber',v_order."orderNumber",'status','PAYMENT_REVIEW','locale',v_order.locale,'resultToken',v_order."resultToken"); end if;
 for v_item in select oi.id,oi."productId",oi."variantId",oi."warehouseId",oi.quantity from public."OrderItem" oi where oi."orderId"=v_order.id and oi."productId" is not null order by oi.id for update loop
   if v_item."variantId" is not null then update public."WarehouseVariantInventory" set "onHand"="onHand"-v_item.quantity,reserved=reserved-v_item.quantity,"updatedAt"=now() where "warehouseId"=v_item."warehouseId" and "variantId"=v_item."variantId";update public."ProductVariant" set stock=greatest(stock-v_item.quantity,0),"updatedAt"=now() where id=v_item."variantId";
   else update public."WarehouseInventory" set "onHand"="onHand"-v_item.quantity,reserved=reserved-v_item.quantity,"updatedAt"=now() where "warehouseId"=v_item."warehouseId" and "productId"=v_item."productId";update public."Product" set stock=greatest(stock-v_item.quantity,0),"updatedAt"=now() where id=v_item."productId"; end if;
   update public."OrderItem" set "inventoryReserved"=false where id=v_item.id;
 end loop;
 update public."Order" set status='PAID'::public."OrderStatus","paymentRefId"=btrim(p_ref_id),"reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;
 return jsonb_build_object('orderNumber',v_order."orderNumber",'status','PAID','locale',v_order.locale,'resultToken',v_order."resultToken");
end $$;
revoke all on function public.finalize_order_payment_v2(text,uuid,text,boolean,text) from public;
grant execute on function public.finalize_order_payment_v2(text,uuid,text,boolean,text) to anon,authenticated;

create or replace function public.create_guest_order_v3(p_request_token uuid,p_customer_name text,p_phone text,p_email text,p_address text,p_province text,p_city text,p_country text,p_postal_code text,p_notes text,p_locale text,p_lines jsonb,p_branch_id text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb;v_order_id text;v_item record;v_branch_id text;v_existing_branch text;v_wh text;
begin
 perform public._expire_pending_location_orders();v_branch_id:=nullif(btrim(coalesce(p_branch_id,'')),'');
 if v_branch_id is null then select b.id into v_branch_id from public."Branch" b where b."isPublished"=true and exists(select 1 from public."Warehouse" w where w."branchId"=b.id and w."isActive"=true) order by b."isDefault" desc,b."createdAt" asc limit 1; end if;
 if v_branch_id is null then return public.create_guest_order(p_request_token,p_customer_name,p_phone,p_email,p_address,p_province,p_city,p_country,p_postal_code,p_notes,p_locale,p_lines); end if;
 if not exists(select 1 from public."Branch" where id=v_branch_id and "isPublished"=true) then raise exception 'branch unavailable'; end if;
 v_result:=public.create_guest_order(p_request_token,p_customer_name,p_phone,p_email,p_address,p_province,p_city,p_country,p_postal_code,p_notes,p_locale,p_lines);v_order_id:=v_result->>'orderId';if v_order_id is null then raise exception 'order unavailable';end if;
 select "branchId" into v_existing_branch from public."Order" where id=v_order_id for update;if v_existing_branch is not null and v_existing_branch<>v_branch_id then raise exception 'order branch mismatch';end if;update public."Order" set "branchId"=v_branch_id,"updatedAt"=now() where id=v_order_id;
 for v_item in select oi.id,oi."productId",oi."variantId",oi.quantity,oi."warehouseId",oi."inventoryReserved" from public."OrderItem" oi where oi."orderId"=v_order_id and oi."productId" is not null order by oi.id for update loop
   if v_item."inventoryReserved" then if v_item."warehouseId" is null or not exists(select 1 from public."Warehouse" w where w.id=v_item."warehouseId" and w."branchId"=v_branch_id and w."isActive"=true) then raise exception 'invalid existing warehouse reservation';end if;continue;end if;v_wh:=null;
   if v_item."variantId" is not null then select w.id into v_wh from public."Warehouse" w join public."WarehouseVariantInventory" i on i."warehouseId"=w.id and i."variantId"=v_item."variantId" where w."branchId"=v_branch_id and w."isActive"=true and i."productId"=v_item."productId" and i."onHand"-i.reserved>=v_item.quantity order by (i."onHand"-i.reserved) desc,w.code for update of i skip locked limit 1;if v_wh is null then raise exception 'insufficient branch variant inventory';end if;update public."WarehouseVariantInventory" set reserved=reserved+v_item.quantity,"updatedAt"=now() where "warehouseId"=v_wh and "variantId"=v_item."variantId" and "onHand"-reserved>=v_item.quantity;
   else select w.id into v_wh from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id and i."productId"=v_item."productId" where w."branchId"=v_branch_id and w."isActive"=true and i."onHand"-i.reserved>=v_item.quantity order by (i."onHand"-i.reserved) desc,w.code for update of i skip locked limit 1;if v_wh is null then raise exception 'insufficient branch inventory';end if;update public."WarehouseInventory" set reserved=reserved+v_item.quantity,"updatedAt"=now() where "warehouseId"=v_wh and "productId"=v_item."productId" and "onHand"-reserved>=v_item.quantity; end if;
   if not found then raise exception 'inventory reservation conflict';end if;update public."OrderItem" set "warehouseId"=v_wh,"inventoryReserved"=true where id=v_item.id;
 end loop;return v_result||jsonb_build_object('branchId',v_branch_id);
end $$;
revoke all on function public.create_guest_order_v3(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text) from public;
grant execute on function public.create_guest_order_v3(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text) to anon,authenticated;
