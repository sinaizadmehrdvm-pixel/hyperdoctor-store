create or replace function public.admin_reports_bundle(p_token text) returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $function$
declare v_admin jsonb;
begin
  v_admin:=public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  return jsonb_build_object(
    'summary', jsonb_build_object(
      'orders', (select count(*) from public."Order"),
      'paidOrders', (select count(*) from public."Order" where status in ('PAID','PROCESSING','SHIPPED','COMPLETED')),
      'failedOrders', (select count(*) from public."Order" where status='FAILED'),
      'revenue', coalesce((select sum(total) from public."Order" where status in ('PAID','PROCESSING','SHIPPED','COMPLETED')),0),
      'discounts', coalesce((select sum("discountAmount") from public."Order" where status in ('PAID','PROCESSING','SHIPPED','COMPLETED')),0),
      'shipping', coalesce((select sum("shippingFee") from public."Order" where status in ('PAID','PROCESSING','SHIPPED','COMPLETED')),0),
      'customers', (select count(*) from public."Customer"),
      'products', (select count(*) from public."Product"),
      'lowStock', (select count(*) from public."Product" where stock <= "lowStockThreshold")
    ),
    'recent', coalesce((select jsonb_agg(to_jsonb(x) order by x."createdAt" desc) from (select id,"orderNumber","customerName",total,status::text as status,gateway::text as gateway,"paymentRefId","createdAt" from public."Order" order by "createdAt" desc limit 50) x),'[]'::jsonb),
    'daily', coalesce((select jsonb_agg(to_jsonb(d) order by d."dateKey") from (select to_char(date_trunc('day',"createdAt"),'YYYY-MM-DD') as "dateKey",count(*) as "orderCount",coalesce(sum(total) filter(where status in ('PAID','PROCESSING','SHIPPED','COMPLETED')),0) as revenue from public."Order" where "createdAt">=now()-interval '30 days' group by 1) d),'[]'::jsonb)
  );
end $function$;
