-- Version 281 completion — serve the 53 verified JTS media files as immutable static assets.
-- Bytes are deterministically reconstructed during build from the checksum-pinned source-derived archive.
-- This migration changes only Media delivery URLs; it does not publish products or create current commerce state.

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public."ProductMediaEvidence" e
  join public."Media" m on m.id=e."mediaId"
  join public."Product" p on p.id=e."productId"
  where p.sku like 'JTS-%'
    and e."verificationStatus"='VERIFIED'
    and e."sourceType"='CATALOG'
    and e."sourceReference" like '%file_0000000098d481f4a1baa422ec264c0d#page=%';

  if v_count <> 53 then
    raise exception 'Version 281 completion requires exactly 53 verified JTS catalog media records; found %', v_count;
  end if;
end $$;

update public."Media" m
set url='/catalog/verified/jts/'||p.sku||'.webp'
from public."Product" p
join public."ProductMediaEvidence" e on e."productId"=p.id
where m."productId"=p.id
  and e."mediaId"=m.id
  and p.sku like 'JTS-%'
  and e."verificationStatus"='VERIFIED'
  and e."sourceType"='CATALOG'
  and e."sourceReference" like '%file_0000000098d481f4a1baa422ec264c0d#page=%';

do $$
declare
  v_static integer;
begin
  select count(*) into v_static
  from public."Media" m
  join public."Product" p on p.id=m."productId"
  join public."ProductMediaEvidence" e on e."mediaId"=m.id
  where p.sku like 'JTS-%'
    and e."verificationStatus"='VERIFIED'
    and m.url='/catalog/verified/jts/'||p.sku||'.webp';

  if v_static <> 53 then
    raise exception 'Version 281 completion expected 53 static JTS media URLs; found %', v_static;
  end if;

  if exists (select 1 from public."Product" where sku like 'JTS-%' and "isPublished") then
    raise exception 'Version 281 completion refuses to publish JTS products';
  end if;
  if exists (select 1 from public."Product" where sku like 'JTS-%' and (coalesce(price,0)<>0 or coalesce(stock,0)<>0)) then
    raise exception 'Version 281 completion refuses nonzero current JTS product price/stock';
  end if;
  if exists (select 1 from public."BranchProductPrice" bp join public."Product" p on p.id=bp."productId" where p.sku like 'JTS-%') then
    raise exception 'Version 281 completion refuses JTS BranchProductPrice rows';
  end if;
  if exists (select 1 from public."WarehouseInventory" wi join public."Product" p on p.id=wi."productId" where p.sku like 'JTS-%') then
    raise exception 'Version 281 completion refuses JTS WarehouseInventory rows';
  end if;
end $$;
