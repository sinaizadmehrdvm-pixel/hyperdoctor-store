ALTER TABLE public."Order" ADD COLUMN IF NOT EXISTS "reservationExpiresAt" TIMESTAMP WITHOUT TIME ZONE;
CREATE INDEX IF NOT EXISTS "Order_status_reservationExpiresAt_idx" ON public."Order" (status,"reservationExpiresAt");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_orderId_idx" ON public."OrderItem" ("productId","orderId");

CREATE OR REPLACE FUNCTION public.create_guest_order(p_request_token uuid, p_customer_name text, p_phone text, p_email text, p_address text, p_province text, p_city text, p_country text, p_postal_code text, p_notes text, p_locale text, p_lines jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
 v_existing public."Order"%rowtype; v_order_id text; v_order_number text; v_checkout_token uuid; v_result_token uuid;
 v_subtotal bigint:=0; v_total bigint:=0; v_line jsonb; v_type text; v_item_id text; v_qty integer; v_name text; v_price integer;
 v_product public."Product"%rowtype; v_service public."Service"%rowtype; v_preferred timestamp; v_seen text[]:=array[]::text[];
 v_reserved integer; v_reservation_expires timestamp:=now()+interval '30 minutes';
BEGIN
 if p_request_token is null then raise exception 'request token required'; end if;
 select * into v_existing from public."Order" where "requestToken"=p_request_token limit 1;
 if found then
  return jsonb_build_object('orderId',v_existing.id,'orderNumber',v_existing."orderNumber",'total',v_existing.total,'checkoutToken',v_existing."checkoutToken",'resultToken',v_existing."resultToken",'status',v_existing.status::text,'reservationExpiresAt',v_existing."reservationExpiresAt");
 end if;
 if p_customer_name is null or char_length(trim(p_customer_name)) not between 2 and 120 then raise exception 'invalid customer name'; end if;
 if p_phone is null or char_length(trim(p_phone)) not between 8 and 24 then raise exception 'invalid phone'; end if;
 if p_email is not null and char_length(trim(p_email))>254 then raise exception 'invalid email'; end if;
 if p_address is null or char_length(trim(p_address)) not between 5 and 500 then raise exception 'invalid address'; end if;
 if p_city is null or char_length(trim(p_city)) not between 2 and 120 then raise exception 'invalid city'; end if;
 if char_length(coalesce(trim(p_province),''))>120 or char_length(coalesce(trim(p_country),''))>120 or char_length(coalesce(trim(p_postal_code),''))>20 or char_length(coalesce(trim(p_notes),''))>1000 then raise exception 'invalid order metadata'; end if;
 if coalesce(p_locale,'') not in ('fa','tr','en','ar') then raise exception 'invalid locale'; end if;
 if p_lines is null or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)<1 or jsonb_array_length(p_lines)>100 then raise exception 'invalid lines'; end if;
 v_order_id:=gen_random_uuid()::text; v_checkout_token:=gen_random_uuid(); v_result_token:=gen_random_uuid();
 v_order_number:='HD-'||to_char(clock_timestamp(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 insert into public."Order"(id,"orderNumber","requestToken","checkoutToken","resultToken","customerName",phone,email,address,province,city,country,"postalCode",notes,locale,currency,subtotal,"discountAmount","shippingFee",total,status,gateway,"shippingMethod","trackingCode","reservationExpiresAt","createdAt","updatedAt")
 values(v_order_id,v_order_number,p_request_token,v_checkout_token,v_result_token,trim(p_customer_name),trim(p_phone),nullif(trim(p_email),''),trim(p_address),coalesce(trim(p_province),''),trim(p_city),coalesce(trim(p_country),''),nullif(trim(p_postal_code),''),coalesce(trim(p_notes),''),p_locale,'IRT',0,0,0,0,'PENDING_PAYMENT'::"OrderStatus",'ZARINPAL'::"PaymentGateway",'','',v_reservation_expires,now(),now());
 for v_line in select value from jsonb_array_elements(p_lines) loop
  if jsonb_typeof(v_line)<>'object' then raise exception 'invalid order line'; end if;
  v_type:=v_line->>'type'; v_item_id:=nullif(btrim(v_line->>'id'),'');
  begin v_qty:=(v_line->>'quantity')::integer; exception when others then raise exception 'invalid quantity'; end;
  if v_item_id is null or char_length(v_item_id)>160 or v_qty<1 or v_qty>50 then raise exception 'invalid order line'; end if;
  if (v_type||':'||v_item_id)=any(v_seen) then raise exception 'duplicate order line'; end if;
  v_seen:=array_append(v_seen,v_type||':'||v_item_id); v_preferred:=null;
  if nullif(v_line->>'preferredDate','') is not null then begin v_preferred:=(v_line->>'preferredDate')::timestamp; exception when others then raise exception 'invalid preferred date'; end; end if;
  if v_type='product' then
   if v_preferred is not null then raise exception 'preferred date is not valid for products'; end if;
   select * into v_product from public."Product" where id=v_item_id and "isPublished"=true for update;
   if not found then raise exception 'product unavailable'; end if;
   if v_product.price is null or v_product.price<=0 then raise exception 'invalid product price'; end if;
   if v_qty<greatest(coalesce(v_product."minOrderQty",1),1) then raise exception 'minimum order quantity is %',greatest(coalesce(v_product."minOrderQty",1),1); end if;
   if v_product."maxOrderQty" is not null and v_qty>v_product."maxOrderQty" then raise exception 'maximum order quantity is %',v_product."maxOrderQty"; end if;
   select coalesce(sum(oi.quantity),0)::integer into v_reserved from public."OrderItem" oi join public."Order" o on o.id=oi."orderId"
   where oi."productId"=v_product.id and o.status='PENDING_PAYMENT'::"OrderStatus" and o."reservationExpiresAt">now();
   if coalesce(v_product.stock,0)-v_reserved<v_qty then raise exception 'insufficient stock'; end if;
   v_price:=v_product.price;
   v_name:=case p_locale when 'fa' then v_product."nameFa" when 'tr' then coalesce(nullif(v_product."nameTr",''),v_product."nameEn") when 'ar' then coalesce(nullif(v_product."nameAr",''),v_product."nameEn") else v_product."nameEn" end;
   if nullif(btrim(v_name),'') is null then raise exception 'product name unavailable'; end if;
   insert into public."OrderItem"(id,"orderId","productId","serviceId","nameSnapshot","priceSnapshot",quantity,"preferredDate") values(gen_random_uuid()::text,v_order_id,v_product.id,null,v_name,v_price,v_qty,null);
  elsif v_type='service' then
   if v_qty<>1 then raise exception 'service quantity must be one'; end if;
   select * into v_service from public."Service" where id=v_item_id and "isPublished"=true;
   if not found then raise exception 'service unavailable'; end if;
   if v_service.price is null or v_service.price<=0 then raise exception 'service requires booking instead of checkout'; end if;
   v_price:=v_service.price;
   v_name:=case p_locale when 'fa' then v_service."nameFa" when 'tr' then coalesce(nullif(v_service."nameTr",''),v_service."nameEn") when 'ar' then coalesce(nullif(v_service."nameAr",''),v_service."nameEn") else v_service."nameEn" end;
   if nullif(btrim(v_name),'') is null then raise exception 'service name unavailable'; end if;
   insert into public."OrderItem"(id,"orderId","productId","serviceId","nameSnapshot","priceSnapshot",quantity,"preferredDate") values(gen_random_uuid()::text,v_order_id,null,v_service.id,v_name,v_price,1,v_preferred);
  else raise exception 'invalid line type'; end if;
  if v_price::bigint*v_qty::bigint>2147483647 then raise exception 'order line total too large'; end if;
  v_subtotal:=v_subtotal+(v_price::bigint*v_qty::bigint); if v_subtotal>2147483647 then raise exception 'order total too large'; end if;
 end loop;
 if v_subtotal<=0 then raise exception 'order total must be greater than zero'; end if;
 v_total:=v_subtotal; update public."Order" set subtotal=v_subtotal::integer,total=v_total::integer,"updatedAt"=now() where id=v_order_id;
 return jsonb_build_object('orderId',v_order_id,'orderNumber',v_order_number,'total',v_total,'checkoutToken',v_checkout_token,'resultToken',v_result_token,'status','PENDING_PAYMENT','reservationExpiresAt',v_reservation_expires);
EXCEPTION WHEN unique_violation THEN
 select * into v_existing from public."Order" where "requestToken"=p_request_token limit 1;
 if found then return jsonb_build_object('orderId',v_existing.id,'orderNumber',v_existing."orderNumber",'total',v_existing.total,'checkoutToken',v_existing."checkoutToken",'resultToken',v_existing."resultToken",'status',v_existing.status::text,'reservationExpiresAt',v_existing."reservationExpiresAt"); end if;
 raise;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_order_checkout_payment_state(p_order_number text,p_checkout_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_order public."Order"%rowtype;
BEGIN
 select * into v_order from public."Order" where "orderNumber"=p_order_number and "checkoutToken"=p_checkout_token limit 1;
 if not found then return null; end if;
 return jsonb_build_object('status',v_order.status::text,'paymentAuthority',v_order."paymentAuthority",'reservationExpiresAt',v_order."reservationExpiresAt");
END;
$function$;

CREATE OR REPLACE FUNCTION public.attach_order_payment_authority(p_order_number text,p_checkout_token uuid,p_authority text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
 if p_authority is null or char_length(trim(p_authority))<5 then return false; end if;
 update public."Order" set "paymentAuthority"=trim(p_authority),"updatedAt"=now()
 where "orderNumber"=p_order_number and "checkoutToken"=p_checkout_token and status='PENDING_PAYMENT'::"OrderStatus"
 and "reservationExpiresAt">now() and ("paymentAuthority" is null or "paymentAuthority"=trim(p_authority));
 return found;
END;
$function$;

CREATE OR REPLACE FUNCTION public.finalize_order_payment(p_order_number text,p_checkout_token uuid,p_authority text,p_success boolean,p_ref_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_order public."Order"%rowtype; v_item public."OrderItem"%rowtype; v_product public."Product"%rowtype;
BEGIN
 select * into v_order from public."Order" where "orderNumber"=p_order_number and "checkoutToken"=p_checkout_token and "paymentAuthority"=p_authority for update;
 if not found then return null; end if;
 if v_order.status='PAID'::"OrderStatus" then return jsonb_build_object('orderNumber',v_order."orderNumber",'status','PAID','locale',v_order.locale,'resultToken',v_order."resultToken"); end if;
 if v_order.status='FAILED'::"OrderStatus" then return jsonb_build_object('orderNumber',v_order."orderNumber",'status','FAILED','locale',v_order.locale,'resultToken',v_order."resultToken"); end if;
 if v_order.status<>'PENDING_PAYMENT'::"OrderStatus" then return jsonb_build_object('orderNumber',v_order."orderNumber",'status',v_order.status::text,'locale',v_order.locale,'resultToken',v_order."resultToken"); end if;
 if not p_success then update public."Order" set status='FAILED'::"OrderStatus","updatedAt"=now() where id=v_order.id; return jsonb_build_object('orderNumber',v_order."orderNumber",'status','FAILED','locale',v_order.locale,'resultToken',v_order."resultToken"); end if;
 if p_ref_id is null or char_length(btrim(p_ref_id))<1 or char_length(btrim(p_ref_id))>128 then raise exception 'valid payment reference required'; end if;
 for v_item in select * from public."OrderItem" where "orderId"=v_order.id and "productId" is not null order by "productId" loop
  select * into v_product from public."Product" where id=v_item."productId" for update;
  if not found then raise exception 'product unavailable during payment finalization'; end if;
  if v_item.quantity<1 or v_product.stock<v_item.quantity then raise exception 'insufficient stock during payment finalization'; end if;
  update public."Product" set stock=stock-v_item.quantity,"updatedAt"=now() where id=v_product.id;
 end loop;
 update public."Order" set status='PAID'::"OrderStatus","paymentRefId"=btrim(p_ref_id),"updatedAt"=now() where id=v_order.id;
 return jsonb_build_object('orderNumber',v_order."orderNumber",'status','PAID','locale',v_order.locale,'resultToken',v_order."resultToken");
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_adjust_stock(p_token text,p_product_id text,p_delta integer,p_reason text,p_note text default '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $function$
DECLARE v_admin jsonb; v_stock integer; v_reserved integer;
BEGIN
 v_admin:=public.admin_validate_session(p_token); if v_admin is null then raise exception 'unauthorized'; end if;
 if p_delta=0 then raise exception 'delta cannot be zero'; end if;
 select stock into v_stock from public."Product" where id=p_product_id for update; if not found then raise exception 'product not found'; end if;
 select coalesce(sum(oi.quantity),0)::integer into v_reserved from public."OrderItem" oi join public."Order" o on o.id=oi."orderId"
 where oi."productId"=p_product_id and o.status='PENDING_PAYMENT'::"OrderStatus" and o."reservationExpiresAt">now();
 if v_stock+p_delta<v_reserved then raise exception 'stock is reserved by pending orders'; end if;
 update public."Product" set stock=v_stock+p_delta,"updatedAt"=now() where id=p_product_id;
 insert into public."StockMovement"("productId",delta,reason,note,"adminId") values(p_product_id,p_delta,left(coalesce(p_reason,'MANUAL'),40),left(coalesce(p_note,''),500),v_admin->>'id');
 return jsonb_build_object('ok',true,'stock',v_stock+p_delta,'reserved',v_reserved,'available',v_stock+p_delta-v_reserved);
END;
$function$;
