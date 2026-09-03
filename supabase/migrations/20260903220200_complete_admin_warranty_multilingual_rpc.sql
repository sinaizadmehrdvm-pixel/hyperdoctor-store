create or replace function public.admin_warranties(p_token text, p_search text default ''::text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_admin jsonb;
  v_result jsonb;
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then
    raise exception 'unauthorized';
  end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x."createdAt" desc), '[]'::jsonb)
  into v_result
  from (
    select
      w.id,
      w."serialNumber",
      w."orderNumber",
      w."purchaseDate",
      w."startsAt",
      w."expiresAt",
      w.status::text as status,
      w.notes,
      w."guestName",
      w."guestPhone",
      w."guestEmail",
      w.locale,
      w."createdAt",
      w."updatedAt",
      p."nameFa" as "productNameFa",
      p."nameTr" as "productNameTr",
      p."nameEn" as "productNameEn",
      p."nameAr" as "productNameAr",
      p.sku,
      c."fullName" as "customerName",
      c.phone as "customerPhone",
      c.email as "customerEmail"
    from public."WarrantyRegistration" w
    join public."Product" p on p.id = w."productId"
    left join public."Customer" c on c.id = w."customerId"
    where coalesce(p_search, '') = ''
      or w."serialNumber" ilike '%' || p_search || '%'
      or w."orderNumber" ilike '%' || p_search || '%'
      or coalesce(w."guestName", '') ilike '%' || p_search || '%'
      or coalesce(w."guestPhone", '') ilike '%' || p_search || '%'
      or p."nameFa" ilike '%' || p_search || '%'
      or p."nameTr" ilike '%' || p_search || '%'
      or p."nameEn" ilike '%' || p_search || '%'
      or p."nameAr" ilike '%' || p_search || '%'
  ) x;

  return v_result;
end
$function$;
