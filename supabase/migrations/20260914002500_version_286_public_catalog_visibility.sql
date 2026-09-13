-- Version 286 — public catalog visibility separated from commerce publication.
--
-- catalogVisible means a product may be browsed as verified catalog content.
-- isPublished remains the commerce-ready gate. This migration intentionally does
-- not publish products and does not create price or inventory data.

alter table public."Product"
  add column if not exists "catalogVisible" boolean not null default false;

comment on column public."Product"."catalogVisible" is
  'Public catalog discovery gate. Independent from isPublished, which remains the commerce-ready gate.';

create index if not exists "Product_catalogVisible_idx"
  on public."Product" ("catalogVisible")
  where "catalogVisible" = true;

do $v286_preflight$
declare
  v_products integer;
  v_media integer;
  v_evidence integer;
  v_blobs integer;
begin
  select count(distinct p.id), count(distinct m.id), count(distinct e.id), count(distinct b."mediaId")
    into v_products, v_media, v_evidence, v_blobs
  from public."Product" p
  join public."Media" m
    on m."productId" = p.id
   and m.id like 'media-v285-%'
  join public."ProductMediaEvidence" e
    on e."productId" = p.id
   and e."mediaId" = m.id
   and e."verificationStatus" = 'VERIFIED'
  join public."ProductMediaBlob" b
    on b."mediaId" = m.id
   and b."mimeType" = 'image/webp'
   and b."byteSize" = octet_length(b.bytes)
   and b.sha256 = encode(digest(b.bytes, 'sha256'), 'hex')
  left join public."Brand" brand on brand.id = p."brandId"
  where coalesce(brand.name, p.brand) in ('B.Well','Hooshmand','EGT');

  if v_products <> 117 or v_media <> 117 or v_evidence <> 117 or v_blobs <> 117 then
    raise exception 'V286 preflight failed: products %, media %, evidence %, blobs %; expected 117 each',
      v_products, v_media, v_evidence, v_blobs;
  end if;

  if exists (
    select 1
    from public."Product" p
    left join public."Brand" brand on brand.id = p."brandId"
    where coalesce(brand.name, p.brand) in ('B.Well','Hooshmand','EGT')
      and (p."isPublished" = true or coalesce(p.price,0) <> 0 or coalesce(p.stock,0) <> 0)
  ) then
    raise exception 'V286 refuses to catalog-expose source products with commerce publication, price, or legacy stock enabled';
  end if;
end
$v286_preflight$;

with eligible as (
  select distinct p.id
  from public."Product" p
  join public."Media" m
    on m."productId" = p.id
   and m.id like 'media-v285-%'
  join public."ProductMediaEvidence" e
    on e."productId" = p.id
   and e."mediaId" = m.id
   and e."verificationStatus" = 'VERIFIED'
  join public."ProductMediaBlob" b
    on b."mediaId" = m.id
   and b."mimeType" = 'image/webp'
   and b."byteSize" = octet_length(b.bytes)
   and b.sha256 = encode(digest(b.bytes, 'sha256'), 'hex')
  left join public."Brand" brand on brand.id = p."brandId"
  where coalesce(brand.name, p.brand) in ('B.Well','Hooshmand','EGT')
)
update public."Product" p
set "catalogVisible" = true,
    "updatedAt" = current_timestamp
from eligible e
where p.id = e.id;

do $v286_verify$
declare
  v_visible integer;
begin
  select count(*) into v_visible
  from public."Product"
  where "catalogVisible" = true;

  if v_visible <> 117 then
    raise exception 'V286 verification failed: expected exactly 117 catalogVisible products, found %', v_visible;
  end if;

  if exists (
    select 1 from public."Product"
    where "catalogVisible" = true
      and ("isPublished" = true or coalesce(price,0) <> 0 or coalesce(stock,0) <> 0)
  ) then
    raise exception 'V286 verification failed: catalog-only product crossed the commerce gate';
  end if;
end
$v286_verify$;

-- Public catalog rows are readable, but commerce publication remains independent.
drop policy if exists "public_read_published_products" on public."Product";
create policy "public_read_catalog_products"
  on public."Product"
  for select
  to anon, authenticated
  using ("isPublished" = true or "catalogVisible" = true);

-- A brand can be displayed when it is itself published or referenced by a
-- public catalog product. This does not make any product commerce-ready.
drop policy if exists "public_read_published_brands" on public."Brand";
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
