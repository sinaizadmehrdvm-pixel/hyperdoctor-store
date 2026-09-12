create temp table v285_media_map (
  sku text primary key,
  source_file_id text not null,
  source_page integer not null,
  visual_scope text not null check (visual_scope in ('EXACT_PRODUCT_VISUAL','OFFICIAL_FAMILY_VISUAL'))
) on commit drop;

insert into v285_media_map (sku,source_file_id,source_page,visual_scope) values
('BW-MED-111','file_00000000607081f4a272b35d4ba49b7b',24,'EXACT_PRODUCT_VISUAL'),
('BW-MED-120','file_00000000607081f4a272b35d4ba49b7b',25,'EXACT_PRODUCT_VISUAL'),
('BW-MED-130','file_00000000607081f4a272b35d4ba49b7b',24,'EXACT_PRODUCT_VISUAL'),
('BW-MED-14','file_00000000607081f4a272b35d4ba49b7b',52,'EXACT_PRODUCT_VISUAL'),
('BW-MED-3000','file_00000000607081f4a272b35d4ba49b7b',33,'EXACT_PRODUCT_VISUAL'),
('BW-MED-320','file_00000000607081f4a272b35d4ba49b7b',20,'EXACT_PRODUCT_VISUAL'),
('BW-MED-325','file_00000000607081f4a272b35d4ba49b7b',19,'EXACT_PRODUCT_VISUAL'),
('BW-MED-420','file_00000000607081f4a272b35d4ba49b7b',49,'EXACT_PRODUCT_VISUAL'),
('BW-MED-440','file_00000000607081f4a272b35d4ba49b7b',49,'EXACT_PRODUCT_VISUAL'),
('BW-MED-450','file_00000000607081f4a272b35d4ba49b7b',48,'EXACT_PRODUCT_VISUAL'),
('BW-MED-53','file_00000000607081f4a272b35d4ba49b7b',10,'EXACT_PRODUCT_VISUAL'),
('BW-MED-55','file_00000000607081f4a272b35d4ba49b7b',10,'EXACT_PRODUCT_VISUAL'),
('BW-MED-56','file_00000000607081f4a272b35d4ba49b7b',13,'EXACT_PRODUCT_VISUAL'),
('BW-MED-58','file_00000000607081f4a272b35d4ba49b7b',11,'EXACT_PRODUCT_VISUAL'),
('BW-MED-59','file_00000000607081f4a272b35d4ba49b7b',14,'EXACT_PRODUCT_VISUAL'),
('BW-MED-61','file_00000000607081f4a272b35d4ba49b7b',16,'EXACT_PRODUCT_VISUAL'),
('BW-MED-62','file_00000000607081f4a272b35d4ba49b7b',16,'EXACT_PRODUCT_VISUAL'),
('BW-MED-63','file_00000000607081f4a272b35d4ba49b7b',16,'EXACT_PRODUCT_VISUAL'),
('BW-MED-870','file_00000000607081f4a272b35d4ba49b7b',44,'EXACT_PRODUCT_VISUAL'),
('BW-MED-900','file_00000000607081f4a272b35d4ba49b7b',42,'EXACT_PRODUCT_VISUAL'),
('BW-MED-915','file_00000000607081f4a272b35d4ba49b7b',41,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-03','file_00000000607081f4a272b35d4ba49b7b',35,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-04','file_00000000607081f4a272b35d4ba49b7b',35,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-06','file_00000000607081f4a272b35d4ba49b7b',35,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-10','file_00000000607081f4a272b35d4ba49b7b',52,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-100','file_00000000607081f4a272b35d4ba49b7b',26,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-110','file_00000000607081f4a272b35d4ba49b7b',25,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-118','file_00000000607081f4a272b35d4ba49b7b',29,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-12','file_00000000607081f4a272b35d4ba49b7b',52,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-165','file_00000000607081f4a272b35d4ba49b7b',51,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-166','file_00000000607081f4a272b35d4ba49b7b',51,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-22','file_00000000607081f4a272b35d4ba49b7b',15,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-25','file_00000000607081f4a272b35d4ba49b7b',15,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-26','file_00000000607081f4a272b35d4ba49b7b',13,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-29','file_00000000607081f4a272b35d4ba49b7b',14,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-310','file_00000000607081f4a272b35d4ba49b7b',20,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-60','file_00000000607081f4a272b35d4ba49b7b',16,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-800','file_00000000607081f4a272b35d4ba49b7b',45,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-850','file_00000000607081f4a272b35d4ba49b7b',44,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-911','file_00000000607081f4a272b35d4ba49b7b',40,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-913','file_00000000607081f4a272b35d4ba49b7b',42,'EXACT_PRODUCT_VISUAL'),
('BW-PRO-922','file_00000000607081f4a272b35d4ba49b7b',40,'EXACT_PRODUCT_VISUAL'),
('BW-TH-490','file_00000000607081f4a272b35d4ba49b7b',47,'EXACT_PRODUCT_VISUAL'),
('BW-TH-75','file_00000000607081f4a272b35d4ba49b7b',8,'EXACT_PRODUCT_VISUAL'),
('BW-TH-912','file_00000000607081f4a272b35d4ba49b7b',39,'EXACT_PRODUCT_VISUAL'),
('BW-TH-917','file_00000000607081f4a272b35d4ba49b7b',39,'EXACT_PRODUCT_VISUAL'),
('BW-WC-150','file_00000000607081f4a272b35d4ba49b7b',37,'EXACT_PRODUCT_VISUAL'),
('BW-WF-1000','file_00000000607081f4a272b35d4ba49b7b',34,'EXACT_PRODUCT_VISUAL'),
('BW-WF-4000','file_00000000607081f4a272b35d4ba49b7b',34,'EXACT_PRODUCT_VISUAL'),
('BW-WI-933','file_00000000607081f4a272b35d4ba49b7b',40,'EXACT_PRODUCT_VISUAL'),
('EGT-ACC-MASK-STRAP','file_0000000061dc81f4b64b0e8c03428808',12,'EXACT_PRODUCT_VISUAL'),
('EGT-ACC-O2-CONNECTOR','file_0000000061dc81f4b64b0e8c03428808',12,'EXACT_PRODUCT_VISUAL'),
('EGT-ACC-TUBE','file_0000000061dc81f4b64b0e8c03428808',12,'EXACT_PRODUCT_VISUAL'),
('EGT-BIPAP-AUTO-S','file_0000000061dc81f4b64b0e8c03428808',6,'OFFICIAL_FAMILY_VISUAL'),
('EGT-BIPAP-AUTO-ST','file_0000000061dc81f4b64b0e8c03428808',7,'OFFICIAL_FAMILY_VISUAL'),
('EGT-BIPAP-EVAPS','file_0000000061dc81f4b64b0e8c03428808',7,'OFFICIAL_FAMILY_VISUAL'),
('EGT-BIPAP-ST','file_0000000061dc81f4b64b0e8c03428808',6,'OFFICIAL_FAMILY_VISUAL'),
('EGT-MASK-FF-NV','file_0000000061dc81f4b64b0e8c03428808',12,'EXACT_PRODUCT_VISUAL'),
('EGT-MASK-FF-V','file_0000000061dc81f4b64b0e8c03428808',12,'EXACT_PRODUCT_VISUAL'),
('EGT-MASK-NASAL','file_0000000061dc81f4b64b0e8c03428808',12,'EXACT_PRODUCT_VISUAL'),
('EGT-MASK-PILLOW','file_0000000061dc81f4b64b0e8c03428808',12,'EXACT_PRODUCT_VISUAL'),
('EGT-MON-OX-WIRELESS','file_0000000061dc81f4b64b0e8c03428808',9,'EXACT_PRODUCT_VISUAL'),
('EGT-NEB-EOLO','file_0000000061dc81f4b64b0e8c03428808',13,'EXACT_PRODUCT_VISUAL'),
('EGT-NIV-TECH','file_0000000061dc81f4b64b0e8c03428808',8,'EXACT_PRODUCT_VISUAL'),
('EGT-OXY-PORTABLE','file_0000000061dc81f4b64b0e8c03428808',4,'EXACT_PRODUCT_VISUAL'),
('EGT-OXY-V10','file_0000000061dc81f4b64b0e8c03428808',3,'OFFICIAL_FAMILY_VISUAL'),
('EGT-OXY-V5','file_0000000061dc81f4b64b0e8c03428808',3,'OFFICIAL_FAMILY_VISUAL'),
('EGT-OXY-V8','file_0000000061dc81f4b64b0e8c03428808',3,'OFFICIAL_FAMILY_VISUAL'),
('EGT-PAP-APAP','file_0000000061dc81f4b64b0e8c03428808',5,'OFFICIAL_FAMILY_VISUAL'),
('EGT-PAP-APAP-PRO','file_0000000061dc81f4b64b0e8c03428808',5,'OFFICIAL_FAMILY_VISUAL'),
('EGT-PAP-CPAP','file_0000000061dc81f4b64b0e8c03428808',5,'OFFICIAL_FAMILY_VISUAL'),
('EGT-PAP-CPAP-PRO','file_0000000061dc81f4b64b0e8c03428808',5,'OFFICIAL_FAMILY_VISUAL'),
('EGT-PWR-24V','file_0000000061dc81f4b64b0e8c03428808',11,'EXACT_PRODUCT_VISUAL'),
('EGT-RESP-VIBRA','file_0000000061dc81f4b64b0e8c03428808',14,'EXACT_PRODUCT_VISUAL'),
('HOO-BABY-SUPPORT','file_000000000f288246ba4de06e2f1113ce',9,'EXACT_PRODUCT_VISUAL'),
('HOO-BAMBOO-CLASSIC','file_000000000f288246ba4de06e2f1113ce',4,'EXACT_PRODUCT_VISUAL'),
('HOO-BAMBOO-WAVE-L','file_000000000f288246ba4de06e2f1113ce',4,'EXACT_PRODUCT_VISUAL'),
('HOO-BAMBOO-WAVE-XL','file_000000000f288246ba4de06e2f1113ce',4,'EXACT_PRODUCT_VISUAL'),
('HOO-BOLSTER','file_000000000f288246ba4de06e2f1113ce',4,'EXACT_PRODUCT_VISUAL'),
('HOO-BUTTERFLY','file_000000000f288246ba4de06e2f1113ce',1,'EXACT_PRODUCT_VISUAL'),
('HOO-CAR-LUMBAR','file_000000000f288246ba4de06e2f1113ce',7,'EXACT_PRODUCT_VISUAL'),
('HOO-CAR-NECK-SUPPORT','file_000000000f288246ba4de06e2f1113ce',6,'EXACT_PRODUCT_VISUAL'),
('HOO-CHILD-CLASSIC','file_000000000f288246ba4de06e2f1113ce',5,'EXACT_PRODUCT_VISUAL'),
('HOO-CHILD-NECK','file_000000000f288246ba4de06e2f1113ce',8,'EXACT_PRODUCT_VISUAL'),
('HOO-CHILD-WAVE','file_000000000f288246ba4de06e2f1113ce',5,'EXACT_PRODUCT_VISUAL'),
('HOO-CLASSIC-L','file_000000000f288246ba4de06e2f1113ce',3,'EXACT_PRODUCT_VISUAL'),
('HOO-CLASSIC-PLUS','file_00000000937881f4a2e5682e049d7c42',28,'EXACT_PRODUCT_VISUAL'),
('HOO-CLASSIC-XL','file_000000000f288246ba4de06e2f1113ce',3,'EXACT_PRODUCT_VISUAL'),
('HOO-CORE-DUAL-BAMBOO','file_000000000f288246ba4de06e2f1113ce',10,'EXACT_PRODUCT_VISUAL'),
('HOO-CRESCENT','file_000000000f288246ba4de06e2f1113ce',2,'EXACT_PRODUCT_VISUAL'),
('HOO-GROOVE-WAVE','file_000000000f288246ba4de06e2f1113ce',1,'EXACT_PRODUCT_VISUAL'),
('HOO-HARD-CERVICAL-COLLAR','file_000000000f288246ba4de06e2f1113ce',10,'EXACT_PRODUCT_VISUAL'),
('HOO-INFANT-MATTRESS','file_000000000f288246ba4de06e2f1113ce',9,'EXACT_PRODUCT_VISUAL'),
('HOO-INFANT-PILLOW','file_000000000f288246ba4de06e2f1113ce',9,'EXACT_PRODUCT_VISUAL'),
('HOO-KNEE-PILLOW','file_000000000f288246ba4de06e2f1113ce',8,'EXACT_PRODUCT_VISUAL'),
('HOO-NECK-L','file_000000000f288246ba4de06e2f1113ce',6,'EXACT_PRODUCT_VISUAL'),
('HOO-NECK-M','file_000000000f288246ba4de06e2f1113ce',6,'EXACT_PRODUCT_VISUAL'),
('HOO-NECK-PLUS','file_00000000937881f4a2e5682e049d7c42',30,'EXACT_PRODUCT_VISUAL'),
('HOO-OFFICE-LUMBAR','file_000000000f288246ba4de06e2f1113ce',7,'EXACT_PRODUCT_VISUAL'),
('HOO-PREGNANCY-BODY','file_000000000f288246ba4de06e2f1113ce',9,'EXACT_PRODUCT_VISUAL'),
('HOO-PULSE-CLASSIC','file_000000000f288246ba4de06e2f1113ce',5,'EXACT_PRODUCT_VISUAL'),
('HOO-PULSE-LUMBAR','file_000000000f288246ba4de06e2f1113ce',7,'EXACT_PRODUCT_VISUAL'),
('HOO-PULSE-NECK','file_000000000f288246ba4de06e2f1113ce',6,'EXACT_PRODUCT_VISUAL'),
('HOO-PULSE-WAVE','file_000000000f288246ba4de06e2f1113ce',5,'EXACT_PRODUCT_VISUAL'),
('HOO-SOFT-CERVICAL-COLLAR','file_000000000f288246ba4de06e2f1113ce',10,'EXACT_PRODUCT_VISUAL'),
('HOO-SQUARE-SEAT','file_000000000f288246ba4de06e2f1113ce',8,'EXACT_PRODUCT_VISUAL'),
('HOO-STAR-LUMBAR','file_000000000f288246ba4de06e2f1113ce',7,'EXACT_PRODUCT_VISUAL'),
('HOO-SUPER-WAVE','file_000000000f288246ba4de06e2f1113ce',1,'EXACT_PRODUCT_VISUAL'),
('HOO-SUPER-WAVE-NASIM','file_000000000f288246ba4de06e2f1113ce',2,'EXACT_PRODUCT_VISUAL'),
('HOO-TRAVEL-GUEST-MATTRESS','file_000000000f288246ba4de06e2f1113ce',10,'EXACT_PRODUCT_VISUAL'),
('HOO-TRAVEL-PILLOW','file_000000000f288246ba4de06e2f1113ce',3,'EXACT_PRODUCT_VISUAL'),
('HOO-U-SEAT','file_000000000f288246ba4de06e2f1113ce',8,'EXACT_PRODUCT_VISUAL'),
('HOO-WAVE','file_000000000f288246ba4de06e2f1113ce',1,'EXACT_PRODUCT_VISUAL'),
('HOO-WAVE-DUAL-LAYER','file_000000000f288246ba4de06e2f1113ce',2,'EXACT_PRODUCT_VISUAL'),
('HOO-WAVE-MEDIUM','file_000000000f288246ba4de06e2f1113ce',3,'EXACT_PRODUCT_VISUAL'),
('HOO-WAVE-PLUS','file_00000000937881f4a2e5682e049d7c42',29,'EXACT_PRODUCT_VISUAL'),
('HOO-WAVE-XXL','file_000000000f288246ba4de06e2f1113ce',2,'EXACT_PRODUCT_VISUAL');

insert into public."Media" (id,url,"altFa","altTr","altEn","altAr",width,height,"sortOrder","productId","createdAt")
select 'media-v285-'||lower(p.sku),
       '/api/catalog-media/media-v285-'||lower(p.sku),
       p."nameFa",p."nameTr",p."nameEn",p."nameAr",240,240,0,p.id,current_timestamp
from v285_media_map vm join public."Product" p on p.sku=vm.sku
on conflict (id) do update set
  url=excluded.url,"altFa"=excluded."altFa","altTr"=excluded."altTr","altEn"=excluded."altEn","altAr"=excluded."altAr",
  width=excluded.width,height=excluded.height,"sortOrder"=excluded."sortOrder","productId"=excluded."productId";

insert into public."ProductMediaEvidence"
  (id,"productId","mediaId","sourceType","sourceReference","sourceModel",notes,"verificationStatus","createdBy","createdAt","updatedAt")
select 'pme-v285-'||lower(p.sku),p.id,'media-v285-'||lower(p.sku),'CATALOG',
       'library:'||vm.source_file_id||'#page='||vm.source_page,
       p."modelNumber",
       case when vm.visual_scope='OFFICIAL_FAMILY_VISUAL'
         then 'Official source-page family/platform visual shared only across variants explicitly listed on that same source page; not sibling-model inference.'
         else 'Exact product visual cropped from the cited official source page.'
       end,
       'VERIFIED','version-285-source-derived-media',now(),now()
from v285_media_map vm join public."Product" p on p.sku=vm.sku
on conflict ("mediaId") do update set
  "productId"=excluded."productId","sourceType"=excluded."sourceType","sourceReference"=excluded."sourceReference",
  "sourceModel"=excluded."sourceModel",notes=excluded.notes,"verificationStatus"='VERIFIED',"updatedAt"=now();

do $$
declare v_desc_complete integer; v_verified_media integer; v_target_verified integer; v_blocked integer;
begin
  select count(*) into v_desc_complete from public."Product"
  where btrim("descriptionFa")<>'' and btrim("descriptionTr")<>'' and btrim("descriptionEn")<>'' and btrim("descriptionAr")<>'';
  if v_desc_complete <> 170 then raise exception 'Version 285 expected 170/170 complete four-language descriptions; found %', v_desc_complete; end if;

  select count(distinct p.id) into v_verified_media
  from public."Product" p join public."Media" m on m."productId"=p.id
  join public."ProductMediaEvidence" e on e."mediaId"=m.id and e."productId"=p.id
  where e."verificationStatus"='VERIFIED' and btrim(coalesce(m.url,''))<>'';
  if v_verified_media <> 170 then raise exception 'Version 285 expected 170/170 Product Master rows with verified media; found %', v_verified_media; end if;

  select count(distinct p.id) into v_target_verified
  from public."Product" p left join public."Brand" b on b.id=p."brandId"
  join public."Media" m on m."productId"=p.id
  join public."ProductMediaEvidence" e on e."mediaId"=m.id and e."productId"=p.id
  where coalesce(b.name,p.brand) in ('B.Well','Hooshmand','EGT')
    and e."verificationStatus"='VERIFIED'
    and m.url='/api/catalog-media/media-v285-'||lower(p.sku) and m.width=240 and m.height=240;
  if v_target_verified <> 117 then raise exception 'Version 285 expected exactly 117 source-derived v285 target media rows; found %', v_target_verified; end if;

  if exists (select 1 from public."Product" where "isPublished") then raise exception 'Version 285 refuses to publish Product Master rows'; end if;
  if exists (select 1 from public."Product" where coalesce(price,0)<>0 or coalesce(stock,0)<>0) then raise exception 'Version 285 refuses nonzero legacy Product price/stock'; end if;
  if exists (select 1 from public."BranchProductPrice") then raise exception 'Version 285 refuses to create current BranchProductPrice rows'; end if;
  if exists (select 1 from public."WarehouseInventory") then raise exception 'Version 285 refuses to create current WarehouseInventory rows'; end if;

  select count(*) into v_blocked from public."CatalogStagingItem"
  where status='NEEDS_REVIEW' and "productId" is null
    and "siteSku" in ('HOO-COOLER-CLASSIC','HOO-COOLER-WAVE-L','HOO-COOLER-WAVE-XL','HOO-SLEEP-NECK','HOO-WAVE-MASSAGER');
  if v_blocked <> 5 then raise exception 'Version 285 changed the fail-closed Hooshmand staging set'; end if;
end $$;
