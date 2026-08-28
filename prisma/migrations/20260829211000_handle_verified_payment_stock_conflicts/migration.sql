CREATE OR REPLACE FUNCTION public.finalize_order_payment(p_order_number text,p_checkout_token uuid,p_authority text,p_success boolean,p_ref_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_order public."Order"%rowtype;
  v_item public."OrderItem"%rowtype;
  v_product public."Product"%rowtype;
  v_conflict boolean:=false;
BEGIN
  select * into v_order from public."Order"
  where "orderNumber"=p_order_number and "checkoutToken"=p_checkout_token and "paymentAuthority"=p_authority
  for update;
  if not found then return null; end if;

  if v_order.status in ('PAID'::"OrderStatus",'PROCESSING'::"OrderStatus",'SHIPPED'::"OrderStatus",'COMPLETED'::"OrderStatus") then
    return jsonb_build_object('orderNumber',v_order."orderNumber",'status',v_order.status::text,'locale',v_order.locale,'resultToken',v_order."resultToken");
  end if;
  if v_order.status='PAYMENT_REVIEW'::"OrderStatus" then
    return jsonb_build_object('orderNumber',v_order."orderNumber",'status','PAYMENT_REVIEW','locale',v_order.locale,'resultToken',v_order."resultToken");
  end if;
  if v_order.status in ('FAILED'::"OrderStatus",'CANCELLED'::"OrderStatus",'REFUNDED'::"OrderStatus") then
    return jsonb_build_object('orderNumber',v_order."orderNumber",'status',v_order.status::text,'locale',v_order.locale,'resultToken',v_order."resultToken");
  end if;
  if v_order.status<>'PENDING_PAYMENT'::"OrderStatus" then
    return jsonb_build_object('orderNumber',v_order."orderNumber",'status',v_order.status::text,'locale',v_order.locale,'resultToken',v_order."resultToken");
  end if;

  if not p_success then
    update public."Order" set status='FAILED'::"OrderStatus","reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;
    return jsonb_build_object('orderNumber',v_order."orderNumber",'status','FAILED','locale',v_order.locale,'resultToken',v_order."resultToken");
  end if;

  if p_ref_id is null or char_length(btrim(p_ref_id))<1 or char_length(btrim(p_ref_id))>128 then
    raise exception 'valid payment reference required';
  end if;

  for v_item in select * from public."OrderItem" where "orderId"=v_order.id and "productId" is not null order by "productId" loop
    select * into v_product from public."Product" where id=v_item."productId" for update;
    if not found or v_item.quantity<1 or v_product.stock<v_item.quantity then v_conflict:=true; exit; end if;
  end loop;

  if v_conflict then
    update public."Order" set status='PAYMENT_REVIEW'::"OrderStatus","paymentRefId"=btrim(p_ref_id),"reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;
    return jsonb_build_object('orderNumber',v_order."orderNumber",'status','PAYMENT_REVIEW','locale',v_order.locale,'resultToken',v_order."resultToken");
  end if;

  for v_item in select * from public."OrderItem" where "orderId"=v_order.id and "productId" is not null order by "productId" loop
    update public."Product" set stock=stock-v_item.quantity,"updatedAt"=now() where id=v_item."productId";
  end loop;

  update public."Order" set status='PAID'::"OrderStatus","paymentRefId"=btrim(p_ref_id),"reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;
  return jsonb_build_object('orderNumber',v_order."orderNumber",'status','PAID','locale',v_order.locale,'resultToken',v_order."resultToken");
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_order_result(p_order_number text,p_result_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_order public."Order"%rowtype;
BEGIN
 select * into v_order from public."Order" where "orderNumber"=p_order_number and "resultToken"=p_result_token limit 1;
 if not found then return null; end if;
 return jsonb_build_object('orderNumber',v_order."orderNumber",'status',v_order.status::text,'total',v_order.total,'currency',v_order.currency,'locale',v_order.locale,'paymentRefId',v_order."paymentRefId",'reservationExpiresAt',v_order."reservationExpiresAt",'reservationExpired',(v_order.status='PENDING_PAYMENT'::"OrderStatus" and v_order."reservationExpiresAt" is not null and v_order."reservationExpiresAt"<=now()));
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_order_status(p_token text,p_id text,p_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $function$
DECLARE v_admin jsonb; v_current public."OrderStatus";
BEGIN
  v_admin:=public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if p_status not in ('PENDING_PAYMENT','FAILED','PROCESSING','SHIPPED','COMPLETED','CANCELLED') then raise exception 'invalid status'; end if;
  select status into v_current from public."Order" where id=p_id for update;
  if not found then return false; end if;
  if v_current='PAYMENT_REVIEW'::"OrderStatus" then raise exception 'payment review requires dedicated resolution'; end if;
  if p_status='PENDING_PAYMENT' and v_current<>'PENDING_PAYMENT'::"OrderStatus" then raise exception 'cannot reopen payment status'; end if;
  if p_status='PROCESSING' and v_current not in ('PAID'::"OrderStatus",'PROCESSING'::"OrderStatus") then raise exception 'invalid order transition'; end if;
  if p_status='SHIPPED' and v_current not in ('PROCESSING'::"OrderStatus",'SHIPPED'::"OrderStatus") then raise exception 'invalid order transition'; end if;
  if p_status='COMPLETED' and v_current not in ('SHIPPED'::"OrderStatus",'COMPLETED'::"OrderStatus") then raise exception 'invalid order transition'; end if;
  if p_status in ('FAILED','CANCELLED') and v_current not in ('PENDING_PAYMENT'::"OrderStatus",'FAILED'::"OrderStatus",'CANCELLED'::"OrderStatus") then raise exception 'paid orders require payment-aware resolution'; end if;
  update public."Order" set status=p_status::public."OrderStatus","updatedAt"=now() where id=p_id;
  return found;
END;
$function$;
