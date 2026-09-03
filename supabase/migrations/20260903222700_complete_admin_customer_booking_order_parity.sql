create or replace function public.admin_customer_summary(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $$
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;
  return jsonb_build_object(
    'total',(select count(*) from public."Customer"),
    'active',(select count(*) from public."Customer" where "isActive"),
    'lifetimeValue',coalesce((select sum(o.total) from public."Order" o where o.status in ('PAID','PROCESSING','SHIPPED','COMPLETED')),0)
  );
end;
$$;

create or replace function public.admin_bookings_search(p_token text,p_search text default '',p_status text default '')
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $$
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',b.id,'serviceId',b."serviceId",
      'serviceNameFa',coalesce(s."nameFa",''),'serviceNameTr',coalesce(s."nameTr",''),'serviceNameEn',coalesce(s."nameEn",''),'serviceNameAr',coalesce(s."nameAr",''),
      'customerName',b."customerName",'phone',b.phone,'email',b.email,'preferredDate',b."preferredDate",'preferredTime',b."preferredTime",
      'address',b.address,'notes',b.notes,'locale',b.locale,'status',b.status::text,'createdAt',b."createdAt"
    ) order by b."createdAt" desc)
    from public."ServiceBooking" b left join public."Service" s on s.id=b."serviceId"
    where (coalesce(p_search,'')='' or b."customerName" ilike '%'||p_search||'%' or b.phone ilike '%'||p_search||'%' or coalesce(b.email,'') ilike '%'||p_search||'%' or coalesce(b.address,'') ilike '%'||p_search||'%' or coalesce(b.notes,'') ilike '%'||p_search||'%' or coalesce(b.locale,'') ilike '%'||p_search||'%' or coalesce(s."nameFa",'') ilike '%'||p_search||'%' or coalesce(s."nameTr",'') ilike '%'||p_search||'%' or coalesce(s."nameEn",'') ilike '%'||p_search||'%' or coalesce(s."nameAr",'') ilike '%'||p_search||'%')
      and (coalesce(p_status,'')='' or b.status::text=p_status)
  ),'[]'::jsonb);
end;
$$;

create or replace function public.admin_orders_search(p_token text,p_search text default '',p_status text default '')
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $$
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',o.id,'orderNumber',o."orderNumber",'customerName',o."customerName",'phone',o.phone,'email',o.email,
      'total',o.total,'currency',o.currency,'status',o.status::text,'gateway',coalesce(o.gateway::text,''),'paymentRefId',o."paymentRefId",'createdAt',o."createdAt",
      'itemCount',(select count(*) from public."OrderItem" oi where oi."orderId"=o.id)
    ) order by o."createdAt" desc)
    from public."Order" o
    where (coalesce(p_search,'')='' or o."orderNumber" ilike '%'||p_search||'%' or o."customerName" ilike '%'||p_search||'%' or o.phone ilike '%'||p_search||'%' or coalesce(o.email,'') ilike '%'||p_search||'%' or coalesce(o."paymentRefId",'') ilike '%'||p_search||'%' or coalesce(o.gateway::text,'') ilike '%'||p_search||'%')
      and (coalesce(p_status,'')='' or o.status::text=p_status)
  ),'[]'::jsonb);
end;
$$;
