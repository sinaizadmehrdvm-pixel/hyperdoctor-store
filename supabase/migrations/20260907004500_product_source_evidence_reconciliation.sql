-- Version 280 — reconcile source evidence for already-promoted products.
--
-- Historical promotions predate ProductSourceEvidence attachment even though their
-- ProductAssetEvidence links are verified and point to confirmed catalog sources.
-- This migration backfills only source provenance. It never writes Product.price,
-- BranchProductPrice, WarehouseInventory, Media, ProductMediaEvidence or publication state.

with ranked as (
  select
    pae."productId",
    a."sourceId",
    i."sourceSku",
    i."sourceModel",
    i."siteSku",
    i."identityStatus",
    i.id as "stagingItemId",
    a.id as "assetId",
    a."assetKind",
    a.uri as "assetUri",
    a."pageNumber",
    pae.role,
    pae."modelEvidence",
    pae."verifiedAt",
    row_number() over (
      partition by pae."productId", a."sourceId"
      order by
        case when pae.role = 'PRIMARY_SOURCE' then 0 else 1 end,
        pae."verifiedAt" desc,
        a."pageNumber" nulls last,
        a.id
    ) as rn
  from public."ProductAssetEvidence" pae
  join public."CatalogAsset" a
    on a.id = pae."assetId"
   and a."verificationStatus" = 'VERIFIED'
  join public."CatalogSource" s
    on s.id = a."sourceId"
   and s.status = 'CONFIRMED'
  join public."CatalogStagingItem" i
    on i.id = pae."sourceStagingItemId"
   and i."productId" = pae."productId"
  where pae.role in ('PRIMARY_SOURCE', 'TECHNICAL_PAGE')
), chosen as (
  select * from ranked where rn = 1
)
insert into public."ProductSourceEvidence"(
  "productId",
  "sourceId",
  "sourceSku",
  "sourceModel",
  snapshot
)
select
  c."productId",
  c."sourceId",
  coalesce(c."sourceSku", ''),
  coalesce(c."sourceModel", ''),
  jsonb_strip_nulls(jsonb_build_object(
    'provenanceType', 'VERIFIED_CATALOG_ASSET',
    'commercePolicy', 'REFERENCE_ONLY',
    'catalogAssetId', c."assetId",
    'assetKind', c."assetKind",
    'assetUri', c."assetUri",
    'pageNumber', c."pageNumber",
    'assetRole', c.role,
    'modelEvidence', nullif(c."modelEvidence", ''),
    'sourceStagingItemId', c."stagingItemId",
    'sourceSku', nullif(c."sourceSku", ''),
    'sourceModel', nullif(c."sourceModel", ''),
    'siteSku', nullif(c."siteSku", ''),
    'identityStatus', c."identityStatus",
    'verifiedAt', c."verifiedAt"
  ))
from chosen c
on conflict ("productId", "sourceId") do nothing;
