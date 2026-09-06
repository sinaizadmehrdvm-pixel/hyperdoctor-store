-- Version 281 — JTS verified product media
-- Source: official Jahan Tajhizat Shafa / JTS catalogue, Library file
-- file_0000000098d481f4a2e5682e049d7c42 is NOT the source used here.
-- Canonical source is file_0000000098d481f4a1baa422ec264c0d (55-page JTS catalog).
-- Media bytes are loaded separately from exact source-derived WEBP crops after this DDL/DML migration.

create table if not exists public."ProductMediaBlob" (
  "mediaId" text primary key references public."Media"(id) on update cascade on delete cascade,
  "mimeType" text not null,
  bytes bytea not null,
  sha256 text not null,
  "byteSize" integer not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint product_media_blob_mime_chk check ("mimeType" in ('image/webp','image/png','image/jpeg')),
  constraint product_media_blob_size_chk check ("byteSize" > 0 and octet_length(bytes) = "byteSize"),
  constraint product_media_blob_sha_chk check (sha256 ~ '^[0-9a-f]{64}$')
);

alter table public."ProductMediaBlob" enable row level security;
revoke all on table public."ProductMediaBlob" from public, anon, authenticated;
grant select, insert, update, delete on table public."ProductMediaBlob" to service_role;

create or replace function public.service_verified_product_media_blob(p_media_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_blob public."ProductMediaBlob"%rowtype;
begin
  select b.* into v_blob
  from public."ProductMediaBlob" b
  join public."ProductMediaEvidence" e on e."mediaId"=b."mediaId"
  where b."mediaId"=p_media_id and e."verificationStatus"='VERIFIED';
  if not found then return null; end if;
  return jsonb_build_object(
    'mediaId',v_blob."mediaId",
    'mimeType',v_blob."mimeType",
    'sha256',v_blob.sha256,
    'byteSize',v_blob."byteSize",
    'bytesBase64',encode(v_blob.bytes,'base64')
  );
end;$function$;

revoke all on function public.service_verified_product_media_blob(text) from public, anon, authenticated;
grant execute on function public.service_verified_product_media_blob(text) to service_role;

create temp table _v281_jts_media_map(
  sku text primary key,
  page_number integer not null
) on commit drop;

insert into _v281_jts_media_map(sku,page_number) values
('JTS-809R-METAL-SPOKE',3),('JTS-809E',4),('JTS-809R',5),('JTS-809B',6),('JTS-809C',7),('JTS-809P',8),('JTS-809A',9),
('JTS-874A',10),('JTS-874B',11),('JTS-874C',12),('JTS-901B55',13),('JTS-951L',14),('JTS-901B',15),('JTS-901MB',16),('JTS-901S',17),('JTS-901XS',18),
('JTS-901A',20),('JTS-901M',21),('JTS-908AQ',22),('JTS-908LAJQE',23),('JTS-980AC-35',24),('JTS-863-12E',25),('JTS-863-20E',26),('JTS-809R-12',27),
('JTS-809R-16',28),('JTS-863LA-12',29),('JTS-908-12',30),('JTS-411-LAJ',31),('JTS-413-LAJ',32),('JTS-695U',33),('JTS-695L',34),('JTS-695Z',35),
('JTS-608L',36),('JTS-681',37),('JTS-105',38),('JTS-1120',39),('JTS-117L',40),('JTS-112A',41),('JTS-608GC',42),('JTS-602LGC',43),('JTS-958-38G44',44),
('JTS-ROLLATOR-FOOTREST',45),('JTS-ROLLATOR',46),('JTS-WALKER-2W-SEAT',47),('JTS-PEDIATRIC-WALKER-2W',48),('JTS-WALKER-STEEL-WHEELED',49),('JTS-WALKER-STEEL',49),
('JTS-WALKER-ALUMINIUM-WHEELED',50),('JTS-WALKER-ALUMINIUM',50),('JTS-CANE-QUAD',51),('JTS-CANE-DERBY',51),('JTS-CRUTCH-AXILLARY',52),('JTS-PEDAL-EXERCISER',53);

do $$
begin
  if (select count(*) from _v281_jts_media_map) <> 53 then raise exception 'Version 281 expected exactly 53 JTS media mappings'; end if;
  if exists (select 1 from _v281_jts_media_map m left join public."Product" p on p.sku=m.sku where p.id is null) then
    raise exception 'Version 281 JTS product mapping is incomplete';
  end if;
end $$;

insert into public."Media"(id,url,"altFa","altTr","altEn","altAr",width,height,"sortOrder","productId")
select
  'media-v281-'||lower(m.sku),
  '/api/catalog-media/'||'media-v281-'||lower(m.sku),
  coalesce(nullif(p."nameFa",''),p.sku),
  coalesce(nullif(p."nameTr",''),nullif(p."nameEn",''),p.sku),
  coalesce(nullif(p."nameEn",''),p.sku),
  coalesce(nullif(p."nameAr",''),nullif(p."nameEn",''),p.sku),
  400,400,0,p.id
from _v281_jts_media_map m join public."Product" p on p.sku=m.sku
on conflict (id) do update set url=excluded.url,"altFa"=excluded."altFa","altTr"=excluded."altTr","altEn"=excluded."altEn","altAr"=excluded."altAr",width=excluded.width,height=excluded.height,"sortOrder"=excluded."sortOrder","productId"=excluded."productId";

insert into public."ProductMediaEvidence"(id,"productId","mediaId","sourceType","sourceReference","sourceModel",notes,"verificationStatus")
select
  'pme-v281-'||lower(m.sku),p.id,'media-v281-'||lower(m.sku),'CATALOG',
  'Official Jahan Tajhizat Shafa / JTS catalogue; library:file_0000000098d481f4a1baa422ec264c0d#page='||m.page_number,
  coalesce(nullif(p."modelNumber",''),p.sku),
  'Source-derived product crop from the exact verified official catalogue page. No generated, synthetic, stock, or substitute imagery.','VERIFIED'
from _v281_jts_media_map m join public."Product" p on p.sku=m.sku
on conflict ("mediaId") do update set "productId"=excluded."productId","sourceType"=excluded."sourceType","sourceReference"=excluded."sourceReference","sourceModel"=excluded."sourceModel",notes=excluded.notes,"verificationStatus"='VERIFIED',"updatedAt"=now();

do $$
begin
  if exists (select 1 from public."Product" where sku like 'JTS-%' and "isPublished") then raise exception 'Version 281 refuses to publish JTS products'; end if;
  if exists (select 1 from public."Product" where sku like 'JTS-%' and (coalesce(price,0)<>0 or coalesce(stock,0)<>0)) then raise exception 'Version 281 refuses nonzero current JTS product price/stock'; end if;
end $$;
