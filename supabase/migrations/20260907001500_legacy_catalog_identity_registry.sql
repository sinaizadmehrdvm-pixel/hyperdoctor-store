create table if not exists public."LegacyCatalogProductIdentity" (
  id text primary key default gen_random_uuid()::text,
  "sourceFile" text not null,
  "sourceRow" integer not null check ("sourceRow">0),
  "legacyCode" text not null,
  "legacyName" text not null,
  barcode text not null default '',
  "legacySku" text not null default '',
  brand text not null default '',
  unit text not null default '',
  "historicalPurchasePrice" bigint,
  "historicalSellingPrice" bigint,
  "historicalInitialStock" integer,
  "historicalMinStock" integer,
  "mainGroup" text not null default '',
  "subGroup" text not null default '',
  status text not null default 'REFERENCE' check (status in ('REFERENCE','ARCHIVED')),
  "importedAt" timestamptz not null default now(),
  unique ("sourceFile","sourceRow")
);

create index if not exists "LegacyCatalogProductIdentity_legacyCode_idx" on public."LegacyCatalogProductIdentity" (lower(btrim("legacyCode")));
create index if not exists "LegacyCatalogProductIdentity_barcode_idx" on public."LegacyCatalogProductIdentity" (lower(btrim(barcode))) where btrim(barcode)<>'';
create index if not exists "LegacyCatalogProductIdentity_name_idx" on public."LegacyCatalogProductIdentity" (lower(btrim("legacyName")));

alter table public."LegacyCatalogProductIdentity" enable row level security;
revoke all on table public."LegacyCatalogProductIdentity" from public, anon, authenticated;
grant select,insert,update,delete on table public."LegacyCatalogProductIdentity" to service_role;

create or replace function public.admin_legacy_catalog_identity_search(p_token text,p_query text default '',p_limit integer default 50)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v_admin public."AdminUser"%rowtype; v_q text:=lower(btrim(coalesce(p_query,''))); v_limit integer:=least(greatest(coalesce(p_limit,50),1),100); v_result jsonb;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x."sourceRow"),'[]'::jsonb) into v_result from (
    select id,"sourceFile","sourceRow","legacyCode","legacyName",barcode,"legacySku",brand,unit,"historicalPurchasePrice","historicalSellingPrice","historicalInitialStock","historicalMinStock","mainGroup","subGroup",status
    from public."LegacyCatalogProductIdentity"
    where status='REFERENCE' and (v_q='' or lower("legacyCode") like '%'||v_q||'%' or lower("legacyName") like '%'||v_q||'%' or lower(barcode) like '%'||v_q||'%' or lower("legacySku") like '%'||v_q||'%' or lower(brand) like '%'||v_q||'%')
    order by "sourceRow" limit v_limit
  ) x;
  return v_result;
end $function$;

create or replace function public.admin_catalog_staging_identity_suggestions(p_token text,p_item_id text,p_limit integer default 12)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v_admin public."AdminUser"%rowtype; v_item public."CatalogStagingItem"%rowtype; v_model text; v_source_sku text; v_barcode text; v_name text; v_brand text; v_limit integer:=least(greatest(coalesce(p_limit,12),1),30); v_result jsonb;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_item from public."CatalogStagingItem" where id=p_item_id;
  if not found then raise exception 'staging item not found'; end if;
  v_model:=lower(regexp_replace(coalesce(nullif(v_item."sourceModel",''),v_item.payload->>'modelNumber',''),'[^[:alnum:]]','','g'));
  v_source_sku:=lower(btrim(coalesce(v_item."sourceSku",'')));
  v_barcode:=lower(btrim(coalesce(v_item.payload->>'barcode',v_item.evidence->>'barcode','')));
  v_name:=lower(btrim(coalesce(v_item.payload->>'nameFa',v_item.payload->>'nameEn','')));
  v_brand:=lower(btrim(coalesce(v_item.payload->>'brand','')));

  select coalesce(jsonb_agg(to_jsonb(y) order by y.score desc,y."sourceRow"),'[]'::jsonb) into v_result from (
    select x.* from (
      select i.id,i."sourceFile",i."sourceRow",i."legacyCode",i."legacyName",i.barcode,i.brand,i.unit,i."historicalPurchasePrice",i."historicalSellingPrice",i."historicalInitialStock",i."historicalMinStock",i."mainGroup",i."subGroup",
        (case when v_barcode<>'' and lower(btrim(i.barcode))=v_barcode then 120 else 0 end +
         case when v_source_sku<>'' and lower(btrim(i."legacySku"))=v_source_sku then 100 else 0 end +
         case when v_model<>'' and regexp_replace(lower(i."legacyName"),'[^[:alnum:]]','','g') like '%'||v_model||'%' then 80 else 0 end +
         case when v_name<>'' and (lower(i."legacyName")=v_name or v_name like '%'||lower(i."legacyName")||'%' or lower(i."legacyName") like '%'||v_name||'%') then 60 else 0 end +
         case when v_brand<>'' and lower(btrim(i.brand))=v_brand then 20 else 0 end) as score
      from public."LegacyCatalogProductIdentity" i where i.status='REFERENCE'
    ) x where x.score>0 order by x.score desc,x."sourceRow" limit v_limit
  ) y;
  return v_result;
end $function$;

revoke all on function public.admin_legacy_catalog_identity_search(text,text,integer) from public,anon,authenticated;
grant execute on function public.admin_legacy_catalog_identity_search(text,text,integer) to service_role;
revoke all on function public.admin_catalog_staging_identity_suggestions(text,text,integer) from public,anon,authenticated;
grant execute on function public.admin_catalog_staging_identity_suggestions(text,text,integer) to service_role;
