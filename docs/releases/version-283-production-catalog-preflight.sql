-- Version 283 read-only Production verification query.
-- This file is documentation/audit support only. It performs no writes.

with verified_media as (
  select distinct "productId"
  from public."ProductMediaEvidence"
  where "verificationStatus" = 'VERIFIED'
), source_evidence as (
  select distinct "productId"
  from public."ProductSourceEvidence"
), default_branch as (
  select b.id, b.code, b.currency, b."isPublished", p."salesEnabled", p."paymentGateway"
  from public."Branch" b
  left join public."BranchCommercePolicy" p on p."branchId" = b.id
  order by b."isDefault" desc, b."createdAt"
  limit 1
), base as (
  select
    p.*,
    p.id in (select "productId" from source_evidence) as source_backed,
    p.id in (select "productId" from verified_media) as has_verified_media,
    exists(select 1 from public."ProductVariant" pv where pv."productId" = p.id) as has_variants,
    exists(
      select 1
      from public."BranchProductPrice" bpp, default_branch b
      where bpp."branchId" = b.id
        and bpp."productId" = p.id
        and bpp."isActive" = true
        and bpp.price > 0
    ) as has_current_branch_price,
    coalesce((
      select sum(greatest(wi."onHand" - wi.reserved - wi."rentalUnits", 0))
      from public."WarehouseInventory" wi
      join public."Warehouse" w on w.id = wi."warehouseId"
      join default_branch b on b.id = w."branchId"
      where wi."productId" = p.id and w."isActive" = true
    ), 0)::int as available
  from public."Product" p
)
select
  count(*) as products,
  count(*) filter (where source_backed) as source_backed_products,
  count(*) filter (
    where btrim(coalesce("nameFa", '')) <> ''
      and btrim(coalesce("nameTr", '')) <> ''
      and btrim(coalesce("nameEn", '')) <> ''
      and btrim(coalesce("nameAr", '')) <> ''
  ) as four_language_name_products,
  count(*) filter (
    where btrim(coalesce("descriptionFa", '')) <> ''
      and btrim(coalesce("descriptionTr", '')) <> ''
      and btrim(coalesce("descriptionEn", '')) <> ''
      and btrim(coalesce("descriptionAr", '')) <> ''
  ) as four_language_description_products,
  count(*) filter (where has_verified_media) as products_with_verified_media,
  count(*) filter (where has_current_branch_price) as products_with_current_branch_price,
  count(*) filter (where available > 0) as products_with_available_inventory,
  count(*) filter (where has_variants) as products_with_variants,
  count(*) filter (where "isPublished") as published_products
from base;
