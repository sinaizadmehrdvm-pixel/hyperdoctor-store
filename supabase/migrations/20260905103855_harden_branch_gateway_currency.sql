create or replace function public.admin_upsert_branch_commerce_policy(p_token text,p_branch_id text,p_sales_enabled boolean,p_payment_gateway text)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_currency text;
begin
  if public._admin_role(p_token) <> 'SUPER_ADMIN' then raise exception 'forbidden'; end if;
  if p_payment_gateway not in ('ZARINPAL','MANUAL','DISABLED') then raise exception 'invalid gateway'; end if;
  select currency into v_currency from public."Branch" where id=p_branch_id;
  if v_currency is null then raise exception 'branch not found'; end if;
  if coalesce(p_sales_enabled,false) and p_payment_gateway='ZARINPAL' and v_currency<>'IRT' then raise exception 'Zarinpal requires IRT branch currency'; end if;
  insert into public."BranchCommercePolicy"("branchId","salesEnabled","paymentGateway","updatedAt") values(p_branch_id,coalesce(p_sales_enabled,false),p_payment_gateway,now())
  on conflict ("branchId") do update set "salesEnabled"=excluded."salesEnabled","paymentGateway"=excluded."paymentGateway","updatedAt"=now();
  return true;
end $$;

create or replace function public.create_guest_order_v4(p_request_token uuid,p_customer_name text,p_phone text,p_email text,p_address text,p_province text,p_city text,p_country text,p_postal_code text,p_notes text,p_locale text,p_lines jsonb,p_branch_id text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb;v_order_id text;v_branch_id text;v_sales_enabled boolean;v_gateway text;v_currency text;v_subtotal bigint;
begin
  v_branch_id:=nullif(btrim(coalesce(p_branch_id,'')),'');
  if v_branch_id is null then select id into v_branch_id from public."Branch" where "isPublished"=true order by "isDefault" desc,"createdAt" asc limit 1; end if;
  if v_branch_id is null then raise exception 'branch unavailable'; end if;
  select cp."salesEnabled",cp."paymentGateway",b.currency into v_sales_enabled,v_gateway,v_currency
  from public."BranchCommercePolicy" cp join public."Branch" b on b.id=cp."branchId"
  where cp."branchId"=v_branch_id and b."isPublished"=true;
  if not found or not coalesce(v_sales_enabled,false) then raise exception 'branch checkout disabled'; end if;
  if v_gateway <> 'ZARINPAL' then raise exception 'payment gateway unavailable for branch'; end if;
  if v_currency <> 'IRT' then raise exception 'payment currency unavailable for branch'; end if;
  v_result:=public.create_guest_order_v3(p_request_token,p_customer_name,p_phone,p_email,p_address,p_province,p_city,p_country,p_postal_code,p_notes,p_locale,p_lines,v_branch_id);
  v_order_id:=v_result->>'orderId';
  if v_order_id is null then raise exception 'order unavailable'; end if;
  update public."OrderItem" oi set "priceSnapshot"=coalesce(
    case when oi."variantId" is not null then (select vp.price from public."BranchVariantPrice" vp where vp."branchId"=v_branch_id and vp."variantId"=oi."variantId" and vp."isActive"=true) end,
    (select bp.price from public."BranchProductPrice" bp where bp."branchId"=v_branch_id and bp."productId"=oi."productId" and bp."isActive"=true),oi."priceSnapshot")
  where oi."orderId"=v_order_id and oi."productId" is not null;
  select coalesce(sum(oi."priceSnapshot"::bigint*oi.quantity::bigint),0) into v_subtotal from public."OrderItem" oi where oi."orderId"=v_order_id;
  if v_subtotal<=0 or v_subtotal>2147483647 then raise exception 'invalid order total'; end if;
  update public."Order" set currency=v_currency,subtotal=v_subtotal::int,total=(v_subtotal-"discountAmount"+"shippingFee")::int,gateway='ZARINPAL'::public."PaymentGateway","updatedAt"=now() where id=v_order_id;
  select jsonb_build_object('orderId',o.id,'orderNumber',o."orderNumber",'total',o.total,'checkoutToken',o."checkoutToken",'resultToken',o."resultToken",'status',o.status::text,'reservationExpiresAt',o."reservationExpiresAt",'branchId',o."branchId",'currency',o.currency,'gateway',o.gateway::text) into v_result from public."Order" o where o.id=v_order_id;
  return v_result;
end $$;
revoke all on function public.admin_upsert_branch_commerce_policy(text,text,boolean,text),public.create_guest_order_v4(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text) from public;
grant execute on function public.admin_upsert_branch_commerce_policy(text,text,boolean,text),public.create_guest_order_v4(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text) to anon,authenticated;
