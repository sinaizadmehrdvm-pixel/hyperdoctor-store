alter table public."SiteSetting"
  add column if not exists "businessTimeZone" text not null default 'Asia/Tehran';

create or replace function public.admin_update_site_settings(p_token text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_admin jsonb;
  v_result jsonb;
  v_tz text := coalesce(nullif(p_data->>'businessTimeZone',''), 'Asia/Tehran');
begin
  v_admin := public.admin_validate_session(p_token);
  if v_admin is null then raise exception 'unauthorized'; end if;

  if not exists (select 1 from pg_timezone_names where name = v_tz) then
    raise exception 'invalid_business_timezone';
  end if;

  insert into public."SiteSetting"(
    id,"holdingName","holdingLogoUrl","subBrandName","subBrandLogoUrl","contactPhone","contactEmail",address,
    "instagramUrl","telegramUrl","whatsappUrl","defaultLocale","supportedLocales",currency,"businessTimeZone","updatedAt"
  ) values (
    1,
    coalesce(p_data->>'holdingName','VITALIS Group'),
    coalesce(p_data->>'holdingLogoUrl',''),
    coalesce(p_data->>'subBrandName','Hyper Doctor'),
    coalesce(p_data->>'subBrandLogoUrl',''),
    coalesce(p_data->>'contactPhone',''),
    coalesce(p_data->>'contactEmail',''),
    coalesce(p_data->>'address',''),
    coalesce(p_data->>'instagramUrl',''),
    coalesce(p_data->>'telegramUrl',''),
    coalesce(p_data->>'whatsappUrl',''),
    coalesce(nullif(p_data->>'defaultLocale',''),'fa'),
    coalesce(nullif(p_data->>'supportedLocales',''),'fa,tr,en,ar'),
    coalesce(nullif(p_data->>'currency',''),'IRT'),
    v_tz,
    now()
  )
  on conflict(id) do update set
    "holdingName"=excluded."holdingName",
    "holdingLogoUrl"=excluded."holdingLogoUrl",
    "subBrandName"=excluded."subBrandName",
    "subBrandLogoUrl"=excluded."subBrandLogoUrl",
    "contactPhone"=excluded."contactPhone",
    "contactEmail"=excluded."contactEmail",
    address=excluded.address,
    "instagramUrl"=excluded."instagramUrl",
    "telegramUrl"=excluded."telegramUrl",
    "whatsappUrl"=excluded."whatsappUrl",
    "defaultLocale"=excluded."defaultLocale",
    "supportedLocales"=excluded."supportedLocales",
    currency=excluded.currency,
    "businessTimeZone"=excluded."businessTimeZone",
    "updatedAt"=now();

  select to_jsonb(s) into v_result from public."SiteSetting" s where id=1;
  return v_result;
end;
$function$;
