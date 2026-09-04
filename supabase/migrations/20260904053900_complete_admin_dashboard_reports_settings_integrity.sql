create or replace function public.admin_dashboard(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_admin public."AdminUser"%rowtype;
begin
  v_admin := public._admin_session_user(p_token);
  return jsonb_build_object(
    'stats', jsonb_build_object(
      'products',(select count(*) from public."Product"),
      'publishedProducts',(select count(*) from public."Product" where "isPublished"=true),
      'services',(select count(*) from public."Service" where "isPublished"=true),
      'orders',(select count(*) from public."Order"),
      'paidOrders',(select count(*) from public."Order" where status in ('PAID','PROCESSING','SHIPPED','COMPLETED')),
      'revenue',(select coalesce(sum(total),0) from public."Order" where status in ('PAID','PROCESSING','SHIPPED','COMPLETED')),
      'openTickets',(select count(*) from public."SupportTicket" where status in ('OPEN','IN_PROGRESS','WAITING_CUSTOMER')),
      'pendingBookings',(select count(*) from public."ServiceBooking" where status='PENDING'),
      'activeWarranties',(select count(*) from public."WarrantyRegistration" where status='ACTIVE'),
      'newContacts',(select count(*) from public."ContactMessage" where status='NEW')
    ),
    'recentOrders',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
      select id,"orderNumber","customerName",total,status::text as status,"createdAt" from public."Order" order by "createdAt" desc limit 8
    ) x),
    'lowStock',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
      select id,"nameFa","nameTr","nameEn","nameAr",stock,"lowStockThreshold",sku
      from public."Product" where "isPublished"=true and stock <= "lowStockThreshold"
      order by stock asc,"updatedAt" desc limit 8
    ) x),
    'recentTickets',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
      select id,"ticketNo",subject,priority::text as priority,status::text as status,"guestName","createdAt"
      from public."SupportTicket" order by "createdAt" desc limit 6
    ) x),
    'admin',jsonb_build_object('id',v_admin.id,'name',v_admin.name,'email',v_admin.email,'role',v_admin.role::text)
  );
end;
$function$;

create or replace function public.admin_update_site_settings(p_token text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_admin jsonb;
  v_result jsonb;
  v_tz text := coalesce(nullif(trim(p_data->>'businessTimeZone'),''), 'Asia/Tehran');
  v_locale text := lower(coalesce(nullif(trim(p_data->>'defaultLocale'),''),'fa'));
  v_currency text := upper(coalesce(nullif(trim(p_data->>'currency'),''),'IRT'));
  v_email text := trim(coalesce(p_data->>'contactEmail',''));
  v_instagram text := trim(coalesce(p_data->>'instagramUrl',''));
  v_telegram text := trim(coalesce(p_data->>'telegramUrl',''));
  v_whatsapp text := trim(coalesce(p_data->>'whatsappUrl',''));
  v_holding text := trim(coalesce(p_data->>'holdingName',''));
  v_subbrand text := trim(coalesce(p_data->>'subBrandName',''));
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;
  if v_locale not in ('fa','tr','en','ar') then raise exception 'invalid_default_locale'; end if;
  if v_currency not in ('IRT','TRY','USD','EUR') then raise exception 'invalid_currency'; end if;
  if not exists (select 1 from pg_timezone_names where name = v_tz) then raise exception 'invalid_business_timezone'; end if;
  if v_holding = '' then raise exception 'holding_name_required'; end if;
  if v_subbrand = '' then raise exception 'subbrand_name_required'; end if;
  if v_email <> '' and v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'invalid_contact_email'; end if;
  if v_instagram <> '' and v_instagram !~* '^https?://' then raise exception 'invalid_instagram_url'; end if;
  if v_telegram <> '' and v_telegram !~* '^https?://' then raise exception 'invalid_telegram_url'; end if;
  if v_whatsapp <> '' and v_whatsapp !~* '^https?://' then raise exception 'invalid_whatsapp_url'; end if;
  insert into public."SiteSetting"(
    id,"holdingName","holdingLogoUrl","subBrandName","subBrandLogoUrl","contactPhone","contactEmail",address,
    "instagramUrl","telegramUrl","whatsappUrl","defaultLocale","supportedLocales",currency,"businessTimeZone","updatedAt"
  ) values (
    1,v_holding,trim(coalesce(p_data->>'holdingLogoUrl','')),v_subbrand,trim(coalesce(p_data->>'subBrandLogoUrl','')),
    trim(coalesce(p_data->>'contactPhone','')),v_email,trim(coalesce(p_data->>'address','')),v_instagram,v_telegram,v_whatsapp,
    v_locale,'fa,tr,en,ar',v_currency,v_tz,now()
  ) on conflict(id) do update set
    "holdingName"=excluded."holdingName","holdingLogoUrl"=excluded."holdingLogoUrl","subBrandName"=excluded."subBrandName",
    "subBrandLogoUrl"=excluded."subBrandLogoUrl","contactPhone"=excluded."contactPhone","contactEmail"=excluded."contactEmail",
    address=excluded.address,"instagramUrl"=excluded."instagramUrl","telegramUrl"=excluded."telegramUrl","whatsappUrl"=excluded."whatsappUrl",
    "defaultLocale"=excluded."defaultLocale","supportedLocales"=excluded."supportedLocales",currency=excluded.currency,
    "businessTimeZone"=excluded."businessTimeZone","updatedAt"=now();
  select to_jsonb(s) into v_result from public."SiteSetting" s where id=1;
  return v_result;
end;
$function$;
