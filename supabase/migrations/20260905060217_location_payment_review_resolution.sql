create or replace function public.admin_resolve_payment_review_v2(p_token text,p_id text,p_resolution text,p_note text)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_admin jsonb;v_order public."Order"%rowtype;v_item record;v_note text;v_resolution text:=upper(btrim(coalesce(p_resolution,'')));v_conflict boolean:=false;
begin
 v_admin:=public.admin_validate_session(p_token); if v_admin is null then raise exception 'unauthorized'; end if;
 if v_resolution not in ('FULFILL','REFUNDED') then raise exception 'invalid resolution'; end if;
 v_note:=left(nullif(btrim(coalesce(p_note,'')),''),500);
 select * into v_order from public."Order" where id=p_id for update; if not found then return null; end if;
 if v_order."branchId" is null then return public.admin_resolve_payment_review(p_token,p_id,p_resolution,p_note); end if;
 if v_order.status<>'PAYMENT_REVIEW'::public."OrderStatus" then raise exception 'order is not in payment review'; end if;
 if v_order."paymentRefId" is null or btrim(v_order."paymentRefId")='' then raise exception 'verified payment reference required'; end if;
 if v_resolution='REFUNDED' then
   if v_note is null then raise exception 'refund reference or note required'; end if;
   perform public._release_order_location_reservations(v_order.id);
   update public."Order" set status='REFUNDED'::public."OrderStatus",notes=concat_ws(E'\n',nullif(notes,''),'[PAYMENT_REVIEW REFUND] '||v_note),"reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;
   return jsonb_build_object('orderNumber',v_order."orderNumber",'status','REFUNDED','locale',v_order.locale,'resultToken',v_order."resultToken",'paymentRefId',v_order."paymentRefId");
 end if;
 for v_item in select oi.id,oi."productId",oi."variantId",oi."warehouseId",oi.quantity,oi."inventoryReserved" from public."OrderItem" oi where oi."orderId"=v_order.id and oi."productId" is not null order by oi.id for update loop
   if v_item.quantity<1 or v_item."warehouseId" is null then v_conflict:=true;exit;end if;
   if v_item."variantId" is not null then perform 1 from public."WarehouseVariantInventory" i join public."Warehouse" w on w.id=i."warehouseId" where i."warehouseId"=v_item."warehouseId" and i."variantId"=v_item."variantId" and i."productId"=v_item."productId" and w."branchId"=v_order."branchId" and w."isActive"=true and i."onHand">=v_item.quantity and (case when v_item."inventoryReserved" then i.reserved>=v_item.quantity else i."onHand"-i.reserved>=v_item.quantity end) for update of i;
   else perform 1 from public."WarehouseInventory" i join public."Warehouse" w on w.id=i."warehouseId" where i."warehouseId"=v_item."warehouseId" and i."productId"=v_item."productId" and w."branchId"=v_order."branchId" and w."isActive"=true and i."onHand">=v_item.quantity and (case when v_item."inventoryReserved" then i.reserved>=v_item.quantity else i."onHand"-i.reserved>=v_item.quantity end) for update of i; end if;
   if not found then v_conflict:=true;exit;end if;
 end loop;
 if v_conflict then raise exception 'insufficient location inventory for payment review resolution'; end if;
 for v_item in select oi.id,oi."productId",oi."variantId",oi."warehouseId",oi.quantity,oi."inventoryReserved" from public."OrderItem" oi where oi."orderId"=v_order.id and oi."productId" is not null order by oi.id for update loop
   if v_item."variantId" is not null then
     if v_item."inventoryReserved" then update public."WarehouseVariantInventory" set "onHand"="onHand"-v_item.quantity,reserved=reserved-v_item.quantity,"updatedAt"=now() where "warehouseId"=v_item."warehouseId" and "variantId"=v_item."variantId"; else update public."WarehouseVariantInventory" set "onHand"="onHand"-v_item.quantity,"updatedAt"=now() where "warehouseId"=v_item."warehouseId" and "variantId"=v_item."variantId" and "onHand"-reserved>=v_item.quantity; end if;
     update public."ProductVariant" set stock=greatest(stock-v_item.quantity,0),"updatedAt"=now() where id=v_item."variantId";
   else
     if v_item."inventoryReserved" then update public."WarehouseInventory" set "onHand"="onHand"-v_item.quantity,reserved=reserved-v_item.quantity,"updatedAt"=now() where "warehouseId"=v_item."warehouseId" and "productId"=v_item."productId"; else update public."WarehouseInventory" set "onHand"="onHand"-v_item.quantity,"updatedAt"=now() where "warehouseId"=v_item."warehouseId" and "productId"=v_item."productId" and "onHand"-reserved>=v_item.quantity; end if;
     update public."Product" set stock=greatest(stock-v_item.quantity,0),"updatedAt"=now() where id=v_item."productId";
   end if;
   update public."OrderItem" set "inventoryReserved"=false where id=v_item.id;
 end loop;
 update public."Order" set status='PAID'::public."OrderStatus",notes=concat_ws(E'\n',nullif(notes,''),case when v_note is not null then '[PAYMENT_REVIEW FULFILL] '||v_note else '[PAYMENT_REVIEW FULFILL]' end),"reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;
 return jsonb_build_object('orderNumber',v_order."orderNumber",'status','PAID','locale',v_order.locale,'resultToken',v_order."resultToken",'paymentRefId',v_order."paymentRefId");
end $$;
revoke all on function public.admin_resolve_payment_review_v2(text,text,text,text) from public;
grant execute on function public.admin_resolve_payment_review_v2(text,text,text,text) to anon,authenticated;
