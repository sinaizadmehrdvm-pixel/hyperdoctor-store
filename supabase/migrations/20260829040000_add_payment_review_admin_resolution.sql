create or replace function public.admin_resolve_payment_review(p_token text,p_id text,p_resolution text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_admin jsonb;
  v_order public."Order"%rowtype;
  v_item public."OrderItem"%rowtype;
  v_product public."Product"%rowtype;
  v_resolution text:=upper(btrim(coalesce(p_resolution,'')));
begin
  v_admin:=public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if v_resolution not in ('FULFILL','REFUND') then raise exception 'invalid resolution'; end if;
  select * into v_order from public."Order" where id=p_id for update;
  if not found then return null; end if;
  if v_order.status<>'PAYMENT_REVIEW'::public."OrderStatus" then raise exception 'order is not in payment review'; end if;
  if v_order."paymentRefId" is null or char_length(btrim(v_order."paymentRefId"))<1 then raise exception 'verified payment reference required'; end if;
  if v_resolution='REFUND' then
    update public."Order" set status='REFUNDED'::public."OrderStatus","reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;
    return jsonb_build_object('orderNumber',v_order."orderNumber",'status','REFUNDED','locale',v_order.locale,'resultToken',v_order."resultToken");
  end if;
  for v_item in select * from public."OrderItem" where "orderId"=v_order.id and "productId" is not null order by "productId" loop
    select * into v_product from public."Product" where id=v_item."productId" for update;
    if not found or v_item.quantity<1 or v_product.stock<v_item.quantity then raise exception 'insufficient stock for payment review fulfillment'; end if;
  end loop;
  for v_item in select * from public."OrderItem" where "orderId"=v_order.id and "productId" is not null order by "productId" loop
    update public."Product" set stock=stock-v_item.quantity,"updatedAt"=now() where id=v_item."productId";
  end loop;
  update public."Order" set status='PAID'::public."OrderStatus","reservationExpiresAt"=null,"updatedAt"=now() where id=v_order.id;
  return jsonb_build_object('orderNumber',v_order."orderNumber",'status','PAID','locale',v_order.locale,'resultToken',v_order."resultToken");
end;
$function$;
revoke all on function public.admin_resolve_payment_review(text,text,text) from public;
grant execute on function public.admin_resolve_payment_review(text,text,text) to anon,authenticated;
