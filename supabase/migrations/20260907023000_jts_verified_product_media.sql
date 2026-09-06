-- Version 281 — JTS verified product media
-- Source: official Jahan Tajhizat Shafa / JTS catalogue, Library file
-- file_0000000098d481f4a1baa422ec264c0d.
-- Media are documentary crops from the exact verified catalogue pages; no synthetic imagery.

create temp table _v281_jts_media_map(
  sku text primary key,
  page_number integer not null,
  file_name text not null
) on commit drop;

insert into _v281_jts_media_map(sku,page_number,file_name) values
  ('JTS-809R-METAL-SPOKE',3,'JTS-809R-METAL-SPOKE.webp'),
  ('JTS-809E',4,'JTS-809E.webp'),
  ('JTS-809R',5,'JTS-809R.webp'),
  ('JTS-809B',6,'JTS-809B.webp'),
  ('JTS-809C',7,'JTS-809C.webp'),
  ('JTS-809P',8,'JTS-809P.webp'),
  ('JTS-809A',9,'JTS-809A.webp'),
  ('JTS-874A',10,'JTS-874A.webp'),
  ('JTS-874B',11,'JTS-874B.webp'),
  ('JTS-874C',12,'JTS-874C.webp'),
  ('JTS-901B55',13,'JTS-901B55.webp'),
  ('JTS-951L',14,'JTS-951L.webp'),
  ('JTS-901B',15,'JTS-901B.webp'),
  ('JTS-901MB',16,'JTS-901MB.webp'),
  ('JTS-901S',17,'JTS-901S.webp'),
  ('JTS-901XS',18,'JTS-901XS.webp'),
  ('JTS-901A',20,'JTS-901A.webp'),
  ('JTS-901M',21,'JTS-901M.webp'),
  ('JTS-908AQ',22,'JTS-908AQ.webp'),
  ('JTS-908LAJQE',23,'JTS-908LAJQE.webp'),
  ('JTS-980AC-35',24,'JTS-980AC-35.webp'),
  ('JTS-863-12E',25,'JTS-863-12E.webp'),
  ('JTS-863-20E',26,'JTS-863-20E.webp'),
  ('JTS-809R-12',27,'JTS-809R-12.webp'),
  ('JTS-809R-16',28,'JTS-809R-16.webp'),
  ('JTS-863LA-12',29,'JTS-863LA-12.webp'),
  ('JTS-908-12',30,'JTS-908-12.webp'),
  ('JTS-411-LAJ',31,'JTS-411-LAJ.webp'),
  ('JTS-413-LAJ',32,'JTS-413-LAJ.webp'),
  ('JTS-695U',33,'JTS-695U.webp'),
  ('JTS-695L',34,'JTS-695L.webp'),
  ('JTS-695Z',35,'JTS-695Z.webp'),
  ('JTS-608L',36,'JTS-608L.webp'),
  ('JTS-681',37,'JTS-681.webp'),
  ('JTS-105',38,'JTS-105.webp'),
  ('JTS-1120',39,'JTS-1120.webp'),
  ('JTS-117L',40,'JTS-117L.webp'),
  ('JTS-112A',41,'JTS-112A.webp'),
  ('JTS-608GC',42,'JTS-608GC.webp'),
  ('JTS-602LGC',43,'JTS-602LGC.webp'),
  ('JTS-958-38G44',44,'JTS-958-38G44.webp'),
  ('JTS-ROLLATOR-FOOTREST',45,'JTS-ROLLATOR-FOOTREST.webp'),
  ('JTS-ROLLATOR',46,'JTS-ROLLATOR.webp'),
  ('JTS-WALKER-2W-SEAT',47,'JTS-WALKER-2W-SEAT.webp'),
  ('JTS-PEDIATRIC-WALKER-2W',48,'JTS-PEDIATRIC-WALKER-2W.webp'),
  ('JTS-WALKER-STEEL-WHEELED',49,'JTS-WALKER-STEEL-WHEELED.webp'),
  ('JTS-WALKER-STEEL',49,'JTS-WALKER-STEEL.webp'),
  ('JTS-WALKER-ALUMINIUM-WHEELED',50,'JTS-WALKER-ALUMINIUM-WHEELED.webp'),
  ('JTS-WALKER-ALUMINIUM',50,'JTS-WALKER-ALUMINIUM.webp'),
  ('JTS-CANE-QUAD',51,'JTS-CANE-QUAD.webp'),
  ('JTS-CANE-DERBY',51,'JTS-CANE-DERBY.webp'),
  ('JTS-CRUTCH-AXILLARY',52,'JTS-CRUTCH-AXILLARY.webp'),
  ('JTS-PEDAL-EXERCISER',53,'JTS-PEDAL-EXERCISER.webp');

do $$
begin
  if (select count(*) from _v281_jts_media_map) <> 53 then
    raise exception 'Version 281 expected exactly 53 JTS media mappings';
  end if;
  if exists (
    select 1 from _v281_jts_media_map m
    left join public."Product" p on p.sku=m.sku
    where p.id is null
  ) then
    raise exception 'Version 281 JTS product mapping is incomplete';
  end if;
end $$;

insert into public."Media"(id,url,"altFa","altTr","altEn","altAr",width,height,"sortOrder","productId")
select
  'media-v281-'||lower(replace(m.sku,'_','-')),
  '/catalog/verified/jts/'||m.file_name,
  coalesce(nullif(p."nameFa",''),p.sku),
  coalesce(nullif(p."nameTr",''),nullif(p."nameEn",''),p.sku),
  coalesce(nullif(p."nameEn",''),p.sku),
  coalesce(nullif(p."nameAr",''),nullif(p."nameEn",''),p.sku),
  400,400,0,p.id
from _v281_jts_media_map m
join public."Product" p on p.sku=m.sku
on conflict (id) do update set
  url=excluded.url,
  "altFa"=excluded."altFa",
  "altTr"=excluded."altTr",
  "altEn"=excluded."altEn",
  "altAr"=excluded."altAr",
  width=excluded.width,
  height=excluded.height,
  "sortOrder"=excluded."sortOrder",
  "productId"=excluded."productId";

insert into public."ProductMediaEvidence"(id,"productId","mediaId","sourceType","sourceReference","sourceModel",notes,"verificationStatus")
select
  'pme-v281-'||lower(replace(m.sku,'_','-')),
  p.id,
  'media-v281-'||lower(replace(m.sku,'_','-')),
  'CATALOG',
  'Official Jahan Tajhizat Shafa / JTS catalogue; library:file_0000000098d481f4a1baa422ec264c0d#page='||m.page_number,
  coalesce(nullif(p."modelNumber",''),p.sku),
  'Source-derived product crop from the exact verified official catalogue page. No generated, synthetic, stock, or substitute imagery.',
  'VERIFIED'
from _v281_jts_media_map m
join public."Product" p on p.sku=m.sku
on conflict ("mediaId") do update set
  "productId"=excluded."productId",
  "sourceType"=excluded."sourceType",
  "sourceReference"=excluded."sourceReference",
  "sourceModel"=excluded."sourceModel",
  notes=excluded.notes,
  "verificationStatus"='VERIFIED',
  "updatedAt"=now();

-- Fail closed: Version 281 must not publish products or establish current commerce state.
do $$
begin
  if exists (select 1 from public."Product" where sku like 'JTS-%' and "isPublished") then
    raise exception 'Version 281 refuses to publish JTS products';
  end if;
  if exists (select 1 from public."Product" where sku like 'JTS-%' and (coalesce(price,0)<>0 or coalesce(stock,0)<>0)) then
    raise exception 'Version 281 refuses nonzero current JTS product price/stock';
  end if;
end $$;
