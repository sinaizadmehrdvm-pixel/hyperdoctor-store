create or replace function public.admin_global_search(p_token text, p_search text default '')
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_admin jsonb;
  v_q text := left(trim(coalesce(p_search,'')), 100);
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if length(v_q) < 2 then return '[]'::jsonb; end if;

  return coalesce((
    select jsonb_agg(to_jsonb(r) order by r.rank, r."updatedAt" desc nulls last)
    from (
      select 1 as rank,'PRODUCT'::text as type,p.id,p."nameFa" as "titleFa",p."nameTr" as "titleTr",p."nameEn" as "titleEn",p."nameAr" as "titleAr",
             concat_ws(' · ',nullif(p.sku,''),nullif(p.brand,'')) as subtitle,
             '/admin/products/'||p.id as href,case when p."isPublished" then 'PUBLISHED' else 'DRAFT' end as status,p."updatedAt"
      from public."Product" p
      where p.sku ilike '%'||v_q||'%' or coalesce(p.brand,'') ilike '%'||v_q||'%' or coalesce(p."modelNumber",'') ilike '%'||v_q||'%'
         or p."nameFa" ilike '%'||v_q||'%' or p."nameTr" ilike '%'||v_q||'%' or p."nameEn" ilike '%'||v_q||'%' or p."nameAr" ilike '%'||v_q||'%'
      union all
      select 2,'ORDER',o.id,o."orderNumber",o."orderNumber",o."orderNumber",o."orderNumber",
             concat_ws(' · ',nullif(o."customerName",''),nullif(o.phone,''),nullif(o."paymentRefId",'')),
             '/admin/orders/'||o.id,o.status::text,o."updatedAt"
      from public."Order" o
      where o."orderNumber" ilike '%'||v_q||'%' or o."customerName" ilike '%'||v_q||'%' or o.phone ilike '%'||v_q||'%' or coalesce(o.email,'') ilike '%'||v_q||'%' or coalesce(o."paymentRefId",'') ilike '%'||v_q||'%'
      union all
      select 3,'CUSTOMER',c.id,c."fullName",c."fullName",c."fullName",c."fullName",
             concat_ws(' · ',nullif(c.phone,''),nullif(c.email,'')),
             '/admin/customers?q='||replace(coalesce(c.email,c.phone,c."fullName"),' ','%20'),case when c."isActive" then 'ACTIVE' else 'INACTIVE' end,c."updatedAt"
      from public."Customer" c
      where c."fullName" ilike '%'||v_q||'%' or c.phone ilike '%'||v_q||'%' or c.email ilike '%'||v_q||'%'
      union all
      select 4,'SERVICE',s.id,s."nameFa",s."nameTr",s."nameEn",s."nameAr",s.slug,
             '/admin/services',case when s."isPublished" then 'PUBLISHED' else 'DRAFT' end,s."updatedAt"
      from public."Service" s
      where s.slug ilike '%'||v_q||'%' or s."nameFa" ilike '%'||v_q||'%' or s."nameTr" ilike '%'||v_q||'%' or s."nameEn" ilike '%'||v_q||'%' or s."nameAr" ilike '%'||v_q||'%'
      union all
      select 5,'SUPPORT',t.id,t.subject,t.subject,t.subject,t.subject,
             concat_ws(' · ',nullif(t."ticketNo",''),nullif(t."guestName",''),nullif(t."guestPhone",'')),
             '/admin/support?q='||replace(t."ticketNo",' ','%20'),t.status::text,t."updatedAt"
      from public."SupportTicket" t
      where t."ticketNo" ilike '%'||v_q||'%' or t.subject ilike '%'||v_q||'%' or coalesce(t."guestName",'') ilike '%'||v_q||'%' or coalesce(t."guestPhone",'') ilike '%'||v_q||'%' or coalesce(t."guestEmail",'') ilike '%'||v_q||'%'
      union all
      select 6,'ARTICLE',a.id,a."titleFa",a."titleTr",a."titleEn",a."titleAr",a.slug,
             '/admin/articles',case when a."isPublished" then 'PUBLISHED' else 'DRAFT' end,a."updatedAt"
      from public."Article" a
      where a.slug ilike '%'||v_q||'%' or a."titleFa" ilike '%'||v_q||'%' or a."titleTr" ilike '%'||v_q||'%' or a."titleEn" ilike '%'||v_q||'%' or a."titleAr" ilike '%'||v_q||'%'
      limit 60
    ) r
  ),'[]'::jsonb);
end;
$function$;
