-- Version 248: source-aware catalog ingestion and provenance.

create table if not exists public."CatalogSource" (
  id text primary key default gen_random_uuid()::text,
  "sourceType" text not null check ("sourceType" in ('CATALOG','PRICE_LIST','INVENTORY_EXPORT','SUPPLIER_FILE','MANUAL_ADMIN','OTHER')),
  title text not null check (btrim(title) <> ''),
  "sourceDate" date,
  reference text not null default '',
  notes text not null default '',
  status text not null default 'CONFIRMED' check (status in ('CONFIRMED','ARCHIVED')),
  "createdBy" text references public."AdminUser"(id) on update cascade on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists catalog_source_identity_unique
  on public."CatalogSource" (
    "sourceType",
    lower(btrim(title)),
    coalesce("sourceDate", date '0001-01-01'),
    lower(btrim(reference))
  );

create table if not exists public."ProductSourceEvidence" (
  id text primary key default gen_random_uuid()::text,
  "productId" text not null references public."Product"(id) on update cascade on delete cascade,
  "sourceId" text not null references public."CatalogSource"(id) on update cascade on delete restrict,
  "sourceSku" text not null default '',
  "sourceModel" text not null default '',
  snapshot jsonb not null default '{}'::jsonb,
  "createdAt" timestamptz not null default now(),
  unique ("productId", "sourceId")
);

create index if not exists product_source_evidence_source_idx
  on public."ProductSourceEvidence"("sourceId", "productId");

create table if not exists public."ProductPriceObservation" (
  id text primary key default gen_random_uuid()::text,
  "productId" text not null references public."Product"(id) on update cascade on delete cascade,
  "sourceId" text not null references public."CatalogSource"(id) on update cascade on delete restrict,
  kind text not null check (kind in ('SELLING','PARTNER','PURCHASE','CONSUMER','OTHER')),
  price bigint not null check (price > 0),
  currency text not null default 'IRT' check (currency in ('IRT','IRR','TRY','USD','EUR')),
  "observedAt" date,
  notes text not null default '',
  "createdAt" timestamptz not null default now(),
  unique ("productId", "sourceId", kind, price)
);

create index if not exists product_price_observation_product_idx
  on public."ProductPriceObservation"("productId", "observedAt" desc, "createdAt" desc);

alter table public."CatalogSource" enable row level security;
alter table public."ProductSourceEvidence" enable row level security;
alter table public."ProductPriceObservation" enable row level security;

revoke all on table public."CatalogSource" from public, anon, authenticated;
revoke all on table public."ProductSourceEvidence" from public, anon, authenticated;
revoke all on table public."ProductPriceObservation" from public, anon, authenticated;
grant select, insert, update on table public."CatalogSource" to service_role;
grant select, insert, update on table public."ProductSourceEvidence" to service_role;
grant select, insert, update on table public."ProductPriceObservation" to service_role;

create or replace function public.admin_catalog_source_prepare(
  p_token text,
  p_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_type text := upper(btrim(coalesce(p_data->>'sourceType','')));
  v_title text := btrim(coalesce(p_data->>'title',''));
  v_reference text := btrim(coalesce(p_data->>'reference',''));
  v_notes text := btrim(coalesce(p_data->>'notes',''));
  v_date date;
  v_source public."CatalogSource"%rowtype;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  if v_type not in ('CATALOG','PRICE_LIST','INVENTORY_EXPORT','SUPPLIER_FILE','MANUAL_ADMIN','OTHER') then raise exception 'invalid source type'; end if;
  if v_title = '' then raise exception 'source title is required'; end if;
  if nullif(btrim(coalesce(p_data->>'sourceDate','')),'') is not null then v_date := (p_data->>'sourceDate')::date; end if;

  insert into public."CatalogSource"("sourceType",title,"sourceDate",reference,notes,status,"createdBy","updatedAt")
  values(v_type,v_title,v_date,v_reference,v_notes,'CONFIRMED',v_admin.id,now())
  on conflict ("sourceType", lower(btrim(title)), (coalesce("sourceDate", date '0001-01-01')), lower(btrim(reference)))
  do update set notes=excluded.notes,status='CONFIRMED',"updatedAt"=now()
  returning * into v_source;

  return jsonb_build_object('id',v_source.id,'sourceType',v_source."sourceType",'title',v_source.title,'sourceDate',v_source."sourceDate",'reference',v_source.reference);
end
$function$;

create or replace function public.admin_product_source_attach(
  p_token text,
  p_product_id text,
  p_source_id text,
  p_snapshot jsonb,
  p_price_kind text default null,
  p_price bigint default null,
  p_currency text default 'IRT'
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_product public."Product"%rowtype;
  v_source public."CatalogSource"%rowtype;
  v_kind text := upper(btrim(coalesce(p_price_kind,'')));
  v_currency text := upper(btrim(coalesce(p_currency,'IRT')));
  v_observed date;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_product from public."Product" where id=p_product_id;
  if not found then raise exception 'product not found'; end if;
  select * into v_source from public."CatalogSource" where id=p_source_id and status='CONFIRMED';
  if not found then raise exception 'catalog source not found'; end if;

  insert into public."ProductSourceEvidence"("productId","sourceId","sourceSku","sourceModel",snapshot)
  values(v_product.id,v_source.id,coalesce(p_snapshot->>'sku',''),coalesce(p_snapshot->>'modelNumber',''),coalesce(p_snapshot,'{}'::jsonb))
  on conflict ("productId","sourceId") do update
    set "sourceSku"=excluded."sourceSku","sourceModel"=excluded."sourceModel",snapshot=excluded.snapshot,"createdAt"=now();

  if p_price is not null and p_price > 0 then
    if v_kind not in ('SELLING','PARTNER','PURCHASE','CONSUMER','OTHER') then raise exception 'invalid price observation kind'; end if;
    if v_currency not in ('IRT','IRR','TRY','USD','EUR') then raise exception 'invalid currency'; end if;
    v_observed := v_source."sourceDate";
    insert into public."ProductPriceObservation"("productId","sourceId",kind,price,currency,"observedAt")
    values(v_product.id,v_source.id,v_kind,p_price,v_currency,v_observed)
    on conflict ("productId","sourceId",kind,price) do nothing;
  end if;

  return jsonb_build_object('productId',v_product.id,'sourceId',v_source.id,'attached',true);
end
$function$;

create or replace function public.admin_catalog_sources(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'sourceType',s."sourceType",'title',s.title,'sourceDate',s."sourceDate",'reference',s.reference,'status',s.status,'productCount',(select count(*) from public."ProductSourceEvidence" e where e."sourceId"=s.id)) order by s."createdAt" desc),'[]'::jsonb) into v_result from public."CatalogSource" s;
  return v_result;
end
$function$;

revoke all on function public.admin_catalog_source_prepare(text,jsonb) from public, anon, authenticated;
revoke all on function public.admin_product_source_attach(text,text,text,jsonb,text,bigint,text) from public, anon, authenticated;
revoke all on function public.admin_catalog_sources(text) from public, anon, authenticated;
grant execute on function public.admin_catalog_source_prepare(text,jsonb) to service_role;
grant execute on function public.admin_product_source_attach(text,text,text,jsonb,text,bigint,text) to service_role;
grant execute on function public.admin_catalog_sources(text) to service_role;
