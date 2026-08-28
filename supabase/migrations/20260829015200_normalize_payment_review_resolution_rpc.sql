DROP FUNCTION IF EXISTS public.admin_resolve_payment_review(text,text,text);
DROP FUNCTION IF EXISTS public.admin_resolve_payment_review(text,text,text,text);

CREATE FUNCTION public.admin_resolve_payment_review(p_token text, p_id text, p_resolution text, p_note text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','extensions'
AS $function$
DECLARE
  v_admin jsonb;
  v_order public."Order"%rowtype;
  v_item public."OrderItem"%rowtype;
  v_product public."Product"%rowtype;
  v_note text;
  v_resolution text:=upper(btrim(coalesce(p_resolution,'')));
BEGIN
  v_admin:=public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if v_resolution not in ('FULFILL','REFUNDED') then raise exception 'invalid resolution'; end if;
  v_note:=left(nullif(btrim(coalesce(p_note,'')),''),500);
  select * into v_order from public."Order" where id=p_id for update;
  if not found then return null; end if;
  if v_order.status<>'PAYMENT_REVIEW'::public."OrderStatus" then raise exception 'order is not in payment review'; end if;
  if v_order."paymentRefId" is null or btrim(v_order."paymentRefId")='' then raise exception 'verified payment reference required'; end if;
  if v_resolution='REFUNDED' then
    if v_note is null then raise exception 'refund reference or note required'; end if;
    update public."Order" set status='REFUNDED'::public."OrderStatus",notes=concat_ws(E'\n',nullif(notes,''),'[PAYMENT_REVIEW REFUND] '||v_note),"reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;
    return jsonb_build_object('orderNumber',v_order."orderNumber",'status','REFUNDED','locale',v_order.locale,'resultToken',v_order."resultToken",'paymentRefId',v_order."paymentRefId");
  end if;
  for v_item in select * from public."OrderItem" where "orderId"=v_order.id and "productId" is not null order by "productId" loop
    select * into v_product from public."Product" where id=v_item."productId" for update;
    if not found or v_item.quantity<1 or v_product.stock<v_item.quantity then raise exception 'insufficient stock for payment review resolution'; end if;
  end loop;
  for v_item in select * from public."OrderItem" where "orderId"=v_order.id and "productId" is not null order by "productId" loop
    update public."Product" set stock=stock-v_item.quantity,"updatedAt"=now() where id=v_item."productId";
  end loop;
  update public."Order" set status='PAID'::public."OrderStatus",notes=concat_ws(E'\n',nullif(notes,''),case when v_note is not null then '[PAYMENT_REVIEW FULFILL] '||v_note else '[PAYMENT_REVIEW FULFILL]' end),"reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;
  return jsonb_build_object('orderNumber',v_order."orderNumber",'status','PAID','locale',v_order.locale,'resultToken',v_order."resultToken",'paymentRefId',v_order."paymentRefId");
END;
$function$;
