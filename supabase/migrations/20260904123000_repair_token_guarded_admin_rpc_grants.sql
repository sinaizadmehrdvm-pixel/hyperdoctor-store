grant execute on function public.admin_catalog_taxonomy_bundle(text,text,text) to anon, authenticated;
grant execute on function public.admin_upsert_taxonomy_term(text,jsonb) to anon, authenticated;
grant execute on function public.admin_archive_taxonomy_term(text,text) to anon, authenticated;
grant execute on function public.admin_set_product_catalog_links(text,text,text,jsonb,jsonb) to anon, authenticated;
grant execute on function public.admin_product_catalog_links(text,text) to anon, authenticated;
grant execute on function public.admin_upsert_product_v2(text,jsonb,jsonb) to anon, authenticated;
