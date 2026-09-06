-- Version 265: server-only SEO index for published public content.
create or replace function public.public_seo_index_v1()
returns jsonb
language sql
security definer
set search_path to 'public'
as $function$
  select jsonb_build_object(
    'products', coalesce((
      select jsonb_agg(jsonb_build_object('slug',p.slug,'updatedAt',p."updatedAt") order by p."updatedAt" desc)
      from public."Product" p
      where p."isPublished"=true and btrim(coalesce(p.slug,''))<>''
    ), '[]'::jsonb),
    'articles', coalesce((
      select jsonb_agg(jsonb_build_object('slug',a.slug,'updatedAt',a."updatedAt") order by a."updatedAt" desc)
      from public."Article" a
      where a."isPublished"=true and btrim(coalesce(a.slug,''))<>''
    ), '[]'::jsonb),
    'pages', coalesce((
      select jsonb_agg(jsonb_build_object('slug',pg.slug,'updatedAt',pg."updatedAt") order by pg."updatedAt" desc)
      from public."Page" pg
      where pg."isPublished"=true and btrim(coalesce(pg.slug,''))<>'' and pg.slug <> 'home'
    ), '[]'::jsonb)
  );
$function$;

revoke all on function public.public_seo_index_v1() from public, anon, authenticated;
grant execute on function public.public_seo_index_v1() to service_role;
