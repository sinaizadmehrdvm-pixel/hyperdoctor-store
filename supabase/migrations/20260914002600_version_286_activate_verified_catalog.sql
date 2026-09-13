-- Version 286 — activate only the source-verified Version 285 catalog set.
-- Run after the Version 286 storefront code is deployed.
-- This migration does not publish products and does not create price/inventory.

do $v286_preflight$
declare
  v_products integer;
  v_media integer;
  v_evidence integer;
  v_blobs integer;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='Product' and column_name='catalogVisible'
  ) then
    raise exception 'V286 activation requires catalogVisible schema migration first';
  end if;

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
  v_media_visible integer;
begin
  select count(*) into v_visible
  from public."Product"
  where "catalogVisible" = true;

  select count(distinct m.id) into v_media_visible
  from public."Media" m
  join public."Product" p on p.id=m."productId"
  where p."catalogVisible"=true and m.id like 'media-v285-%';

  if v_visible <> 117 or v_media_visible <> 117 then
    raise exception 'V286 verification failed: visible products %, visible media %; expected 117 each',
      v_visible, v_media_visible;
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
