drop function if exists public.admin_reviews(text);
create or replace function public.admin_reviews(p_token text, p_search text default '') returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $function$
declare v jsonb;
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x."createdAt" desc),'[]'::jsonb) into v
  from (
    select r.id,r."authorName",r.rating,r.title,r.body,r.status::text as status,r."isVerified",r."createdAt",
      p."nameFa" as "productNameFa",p."nameTr" as "productNameTr",p."nameEn" as "productNameEn",p."nameAr" as "productNameAr",p.sku
    from public."Review" r join public."Product" p on p.id=r."productId"
    where coalesce(p_search,'')=''
      or r."authorName" ilike '%'||p_search||'%'
      or coalesce(r.title,'') ilike '%'||p_search||'%'
      or coalesce(r.body,'') ilike '%'||p_search||'%'
      or p.sku ilike '%'||p_search||'%'
      or coalesce(p."nameFa",'') ilike '%'||p_search||'%'
      or coalesce(p."nameTr",'') ilike '%'||p_search||'%'
      or coalesce(p."nameEn",'') ilike '%'||p_search||'%'
      or coalesce(p."nameAr",'') ilike '%'||p_search||'%'
  ) x;
  return v;
end $function$;
