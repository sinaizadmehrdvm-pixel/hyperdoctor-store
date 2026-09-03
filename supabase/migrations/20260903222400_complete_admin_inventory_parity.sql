create or replace function public.admin_inventory(p_token text, p_search text default '')
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v jsonb;
begin
  if public.admin_validate_session(p_token) is null then
    raise exception 'unauthorized';
  end if;

  select jsonb_build_object(
    'products', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.stock asc, x."nameFa")
      from (
        select
          p.id,
          p.sku,
          p."nameFa",
          p."nameTr",
          p."nameEn",
          p."nameAr",
          p.brand,
          p.stock,
          p."lowStockThreshold",
          p."isPublished",
          coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'delta', m.delta,
                'reason', m.reason,
                'note', m.note,
                'createdAt', m."createdAt"
              ) order by m."createdAt" desc
            )
            from (
              select *
              from public."StockMovement" sm
              where sm."productId" = p.id
              order by sm."createdAt" desc
              limit 5
            ) m
          ), '[]'::jsonb) as movements
        from public."Product" p
        where coalesce(p_search, '') = ''
           or p."nameFa" ilike '%' || p_search || '%'
           or p."nameTr" ilike '%' || p_search || '%'
           or p."nameEn" ilike '%' || p_search || '%'
           or p."nameAr" ilike '%' || p_search || '%'
           or p.sku ilike '%' || p_search || '%'
           or p.brand ilike '%' || p_search || '%'
      ) x
    ), '[]'::jsonb),
    'totalStock', coalesce((select sum(stock) from public."Product"), 0),
    'lowStock', coalesce((select count(*) from public."Product" where stock <= "lowStockThreshold"), 0),
    'healthyStock', coalesce((select count(*) from public."Product" where stock > "lowStockThreshold"), 0)
  ) into v;

  return v;
end
$function$;

create or replace function public.admin_adjust_stock(p_token text, p_product_id text, p_delta integer, p_reason text, p_note text default '')
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_admin jsonb;
  v_stock integer;
  v_reserved integer;
  v_reason text;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if p_delta = 0 then raise exception 'delta cannot be zero'; end if;
  if abs(p_delta) > 1000000 then raise exception 'delta exceeds allowed range'; end if;

  v_reason := upper(coalesce(p_reason, 'MANUAL'));
  if v_reason not in ('PURCHASE','SALE_ADJUSTMENT','RETURN','DAMAGED','MANUAL') then
    raise exception 'invalid stock movement reason';
  end if;

  select stock into v_stock
  from public."Product"
  where id = p_product_id
  for update;
  if not found then raise exception 'product not found'; end if;

  select coalesce(sum(oi.quantity),0)::integer into v_reserved
  from public."OrderItem" oi
  join public."Order" o on o.id = oi."orderId"
  where oi."productId" = p_product_id
    and o.status = 'PENDING_PAYMENT'::"OrderStatus"
    and o."reservationExpiresAt" > now();

  if v_stock + p_delta < 0 then
    raise exception 'stock cannot become negative';
  end if;
  if v_stock + p_delta < v_reserved then
    raise exception 'stock is reserved by pending orders';
  end if;

  update public."Product"
  set stock = v_stock + p_delta, "updatedAt" = now()
  where id = p_product_id;

  insert into public."StockMovement"("productId",delta,reason,note,"adminId")
  values(p_product_id,p_delta,v_reason,left(coalesce(p_note,''),500),v_admin->>'id');

  return jsonb_build_object('ok',true,'stock',v_stock+p_delta,'reserved',v_reserved,'available',v_stock+p_delta-v_reserved);
end
$function$;
