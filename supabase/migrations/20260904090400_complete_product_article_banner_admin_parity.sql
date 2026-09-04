create or replace function public.admin_products_bundle(p_token text, p_search text default null::text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_admin public."AdminUser"%rowtype; v_q text;
begin
  v_admin := public._admin_session_user(p_token);
  v_q := lower(trim(coalesce(p_search,'')));
  return jsonb_build_object(
    'products',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
      select p.id,p.slug,p."nameFa",p."nameTr",p."nameEn",p."nameAr",p.sku,p.brand,p.price,p.stock,p."lowStockThreshold",p."isPublished",p."isFeatured",p."isNewArrival",p."createdAt",p."updatedAt",
        c.id as "categoryId",c."nameFa" as "categoryNameFa",c."nameTr" as "categoryNameTr",c."nameEn" as "categoryNameEn",c."nameAr" as "categoryNameAr",
        (select m.url from public."Media" m where m."productId"=p.id order by m."sortOrder",m."createdAt" limit 1) as image
      from public."Product" p join public."Category" c on c.id=p."categoryId"
      where v_q='' or lower(coalesce(p."nameFa",'')) like '%'||v_q||'%' or lower(coalesce(p."nameTr",'')) like '%'||v_q||'%' or lower(coalesce(p."nameEn",'')) like '%'||v_q||'%' or lower(coalesce(p."nameAr",'')) like '%'||v_q||'%' or lower(coalesce(p.sku,'')) like '%'||v_q||'%' or lower(coalesce(p.brand,'')) like '%'||v_q||'%' or lower(coalesce(c."nameFa",'')) like '%'||v_q||'%' or lower(coalesce(c."nameTr",'')) like '%'||v_q||'%' or lower(coalesce(c."nameEn",'')) like '%'||v_q||'%' or lower(coalesce(c."nameAr",'')) like '%'||v_q||'%'
      order by p."createdAt" desc limit 500
    ) x),
    'categories',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,slug,"nameFa","nameTr","nameEn","nameAr",vertical::text as vertical,"order","isPublished" from public."Category" order by "order", "nameFa") x)
  );
end;$function$;

create or replace function public.admin_articles_bundle(p_token text, p_search text default '')
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare v_q text:=trim(coalesce(p_search,''));
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;
  return coalesce((select jsonb_agg(to_jsonb(a) order by coalesce(a."publishedAt",a."createdAt") desc)
    from public."Article" a
    where v_q='' or a."titleFa" ilike '%'||v_q||'%' or a."titleTr" ilike '%'||v_q||'%' or a."titleEn" ilike '%'||v_q||'%' or a."titleAr" ilike '%'||v_q||'%' or a.slug ilike '%'||v_q||'%' or coalesce(a.category,'') ilike '%'||v_q||'%'),'[]'::jsonb);
end;$function$;

create or replace function public.admin_banners_bundle(p_token text, p_search text default '')
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare v_q text:=trim(coalesce(p_search,''));
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;
  return coalesce((select jsonb_agg(to_jsonb(b) order by b."order",b."createdAt") from public."SiteBanner" b
    where v_q='' or b.key ilike '%'||v_q||'%' or b."titleFa" ilike '%'||v_q||'%' or b."titleTr" ilike '%'||v_q||'%' or b."titleEn" ilike '%'||v_q||'%' or b."titleAr" ilike '%'||v_q||'%' or coalesce(b."subtitleFa",'') ilike '%'||v_q||'%' or coalesce(b."subtitleTr",'') ilike '%'||v_q||'%' or coalesce(b."subtitleEn",'') ilike '%'||v_q||'%' or coalesce(b."subtitleAr",'') ilike '%'||v_q||'%' or coalesce(b."linkUrl",'') ilike '%'||v_q||'%'),'[]'::jsonb);
end;$function$;
