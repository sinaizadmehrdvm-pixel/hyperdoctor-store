create or replace function public.track_order_public_v2(p_order_number text,p_phone text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_result jsonb;
begin
 select jsonb_build_object('orderNumber',o."orderNumber",'status',o.status::text,'currency',o.currency,'subtotal',o.subtotal,'shippingFee',o."shippingFee",'total',o.total,'shippingMethod',o."shippingMethod",'trackingCode',o."trackingCode",'createdAt',o."createdAt",'shippedAt',o."shippedAt",'completedAt',o."completedAt",'branch',case when b.id is null then null else jsonb_build_object('code',b.code,'nameFa',b."nameFa",'nameTr',b."nameTr",'nameEn',b."nameEn",'nameAr',b."nameAr",'countryCode',b."countryCode",'currency',b.currency) end,'items',coalesce((select jsonb_agg(jsonb_build_object('name',i."nameSnapshot",'quantity',i.quantity,'price',i."priceSnapshot") order by i.id) from public."OrderItem" i where i."orderId"=o.id),'[]'::jsonb)) into v_result from public."Order" o left join public."Branch" b on b.id=o."branchId" where upper(o."orderNumber")=upper(btrim(p_order_number)) and regexp_replace(o.phone,'[^0-9+]','','g')=regexp_replace(btrim(p_phone),'[^0-9+]','','g') limit 1; return v_result;
end $$;
revoke all on function public.track_order_public_v2(text,text) from public; grant execute on function public.track_order_public_v2(text,text) to anon,authenticated;

create or replace function public.admin_update_order_fulfilment(p_token text,p_id text,p_shipping_method text,p_tracking_code text,p_status text default null)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_current public."OrderStatus"; v_next public."OrderStatus"; v_method text; v_code text; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 v_method:=left(btrim(coalesce(p_shipping_method,'')),120); v_code:=left(btrim(coalesce(p_tracking_code,'')),120); select status into v_current from public."Order" where id=p_id for update; if not found then raise exception 'order not found'; end if;
 v_next:=case when nullif(btrim(coalesce(p_status,'')),'') is null then v_current else upper(btrim(p_status))::public."OrderStatus" end;
 if v_next not in ('PAID'::public."OrderStatus",'PROCESSING'::public."OrderStatus",'SHIPPED'::public."OrderStatus",'COMPLETED'::public."OrderStatus") then raise exception 'invalid fulfilment status'; end if;
 if v_next='PROCESSING'::public."OrderStatus" and v_current not in ('PAID'::public."OrderStatus",'PROCESSING'::public."OrderStatus") then raise exception 'invalid order transition'; end if;
 if v_next='SHIPPED'::public."OrderStatus" and v_current not in ('PROCESSING'::public."OrderStatus",'SHIPPED'::public."OrderStatus") then raise exception 'invalid order transition'; end if;
 if v_next='COMPLETED'::public."OrderStatus" and v_current not in ('SHIPPED'::public."OrderStatus",'COMPLETED'::public."OrderStatus") then raise exception 'invalid order transition'; end if;
 if v_next in ('SHIPPED'::public."OrderStatus",'COMPLETED'::public."OrderStatus") and v_method='' then raise exception 'shipping method required'; end if;
 update public."Order" set status=v_next,"shippingMethod"=v_method,"trackingCode"=v_code,"shippedAt"=case when v_next in ('SHIPPED'::public."OrderStatus",'COMPLETED'::public."OrderStatus") then coalesce("shippedAt",now()) else "shippedAt" end,"completedAt"=case when v_next='COMPLETED'::public."OrderStatus" then coalesce("completedAt",now()) else "completedAt" end,"updatedAt"=now() where id=p_id;
 select jsonb_build_object('id',id,'status',status::text,'shippingMethod',"shippingMethod",'trackingCode',"trackingCode",'shippedAt',"shippedAt",'completedAt',"completedAt") into v_result from public."Order" where id=p_id; return v_result;
end $$;
revoke all on function public.admin_update_order_fulfilment(text,text,text,text,text) from public; grant execute on function public.admin_update_order_fulfilment(text,text,text,text,text) to anon,authenticated;

create or replace function public.admin_order_detail_v3(p_token text,p_id text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SALES'::public."AdminRole",'SUPPORT'::public."AdminRole") then raise exception 'forbidden'; end if;
 select jsonb_build_object('id',o.id,'orderNumber',o."orderNumber",'customerName',o."customerName",'phone',o.phone,'email',o.email,'address',o.address,'province',o.province,'city',o.city,'country',o.country,'postalCode',o."postalCode",'notes',o.notes,'locale',o.locale,'currency',o.currency,'subtotal',o.subtotal,'shippingFee',o."shippingFee",'total',o.total,'status',o.status::text,'gateway',o.gateway::text,'paymentAuthority',o."paymentAuthority",'paymentRefId',o."paymentRefId",'createdAt',o."createdAt",'updatedAt',o."updatedAt",'reservationExpiresAt',o."reservationExpiresAt",'shippingMethod',o."shippingMethod",'trackingCode',o."trackingCode",'shippedAt',o."shippedAt",'completedAt',o."completedAt",'branch',case when b.id is null then null else jsonb_build_object('id',b.id,'code',b.code,'nameFa',b."nameFa",'nameTr',b."nameTr",'nameEn',b."nameEn",'nameAr',b."nameAr",'countryCode',b."countryCode",'currency',b.currency) end,'items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'productId',i."productId",'serviceId',i."serviceId",'variantId',i."variantId",'variantSkuSnapshot',i."variantSkuSnapshot",'variantAttributesSnapshot',i."variantAttributesSnapshot",'nameSnapshot',i."nameSnapshot",'priceSnapshot',i."priceSnapshot",'quantity',i.quantity,'preferredDate',i."preferredDate",'inventoryReserved',i."inventoryReserved",'warehouse',case when w.id is null then null else jsonb_build_object('id',w.id,'code',w.code,'nameFa',w."nameFa",'nameTr',w."nameTr",'nameEn',w."nameEn",'nameAr',w."nameAr") end) order by i.id) from public."OrderItem" i left join public."Warehouse" w on w.id=i."warehouseId" where i."orderId"=o.id),'[]'::jsonb)) into v_result from public."Order" o left join public."Branch" b on b.id=o."branchId" where o.id=p_id; return v_result;
end $$;
revoke all on function public.admin_order_detail_v3(text,text) from public; grant execute on function public.admin_order_detail_v3(text,text) to anon,authenticated;
