-- Version 286 — public catalog visibility schema and RLS foundation.
--
-- This migration is intentionally safe to apply before the Version 286 app deploy:
-- catalogVisible defaults to false, so no new product becomes public until the
-- separate activation migration runs after the storefront code is live.

alter table public."Product"
  add column if not exists "catalogVisible" boolean not null default false;

comment on column public."Product"."catalogVisible" is
  'Public catalog discovery gate. Independent from isPublished, which remains the commerce-ready gate.';

create index if not exists "Product_catalogVisible_idx"
  on public."Product" ("catalogVisible")
  where "catalogVisible" = true;

-- Public catalog rows are readable, but commerce publication remains independent.
drop policy if exists "public_read_published_products" on public."Product";
drop policy if exists "public_read_catalog_products" on public."Product";
create policy "public_read_catalog_products"
  on public."Product"
  for select
  to anon, authenticated
  using ("isPublished" = true or "catalogVisible" = true);

-- A brand can be displayed when it is itself published or referenced by a
-- public catalog product. This does not make any product commerce-ready.
drop policy if exists "public_read_published_brands" on public."Brand";
drop policy if exists "public_read_catalog_brands" on public."Brand";
create policy "public_read_catalog_brands"
  on public."Brand"
  for select
  to anon, authenticated
  using (
    "isPublished" = true
    or exists (
      select 1 from public."Product" p
      where p."brandId" = "Brand".id
        and (p."isPublished" = true or p."catalogVisible" = true)
    )
  );

-- Source-verified images must be readable for catalog-visible products.
drop policy if exists "public_read_product_media" on public."Media";
create policy "public_read_product_media"
  on public."Media"
  for select
  to anon, authenticated
  using (
    "productId" is not null
    and exists (
      select 1 from public."Product" p
      where p.id = "Media"."productId"
        and (p."isPublished" = true or p."catalogVisible" = true)
    )
  );

-- Preserve secondary category navigation for catalog-visible rows.
drop policy if exists "public_read_secondary_categories" on public."ProductSecondaryCategory";
create policy "public_read_secondary_categories"
  on public."ProductSecondaryCategory"
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public."Product" p
      join public."Category" c on c.id = "ProductSecondaryCategory"."categoryId"
      where p.id = "ProductSecondaryCategory"."productId"
        and (p."isPublished" = true or p."catalogVisible" = true)
        and c."isPublished" = true
    )
  );

-- Taxonomy and structured attributes are catalog content, not commerce data.
drop policy if exists "public_read_product_taxonomy" on public."ProductTaxonomy";
create policy "public_read_product_taxonomy"
  on public."ProductTaxonomy"
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public."Product" p
      join public."TaxonomyTerm" t on t.id = "ProductTaxonomy"."termId"
      where p.id = "ProductTaxonomy"."productId"
        and (p."isPublished" = true or p."catalogVisible" = true)
        and t."isPublished" = true
    )
  );

drop policy if exists "public_read_attribute_values" on public."ProductAttributeValue";
create policy "public_read_attribute_values"
  on public."ProductAttributeValue"
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public."Product" p
      where p.id = "ProductAttributeValue"."productId"
        and (p."isPublished" = true or p."catalogVisible" = true)
    )
    and exists (
      select 1 from public."ProductAttributeDefinition" d
      where d.id = "ProductAttributeValue"."definitionId"
        and d."isPublished" = true
    )
  );

-- Relations and approved reviews may be shown for public catalog products.
drop policy if exists "public published product relations" on public."ProductRelation";
drop policy if exists "public catalog product relations" on public."ProductRelation";
create policy "public catalog product relations"
  on public."ProductRelation"
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public."Product" p
      where p.id = "ProductRelation"."productId"
        and (p."isPublished" = true or p."catalogVisible" = true)
    )
    and exists (
      select 1 from public."Product" r
      where r.id = "ProductRelation"."relatedProductId"
        and (r."isPublished" = true or r."catalogVisible" = true)
    )
  );

drop policy if exists "public_read_approved_reviews" on public."Review";
create policy "public_read_approved_reviews"
  on public."Review"
  for select
  to anon, authenticated
  using (
    status = 'APPROVED'::public."ReviewStatus"
    and exists (
      select 1 from public."Product" p
      where p.id = "Review"."productId"
        and (p."isPublished" = true or p."catalogVisible" = true)
    )
  );

-- Keep variants strictly commerce-gated. The existing ProductVariant policy is
-- intentionally unchanged and still requires the parent Product.isPublished=true.

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
      where (p."isPublished"=true or p."catalogVisible"=true)
        and btrim(coalesce(p.slug,''))<>''
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
