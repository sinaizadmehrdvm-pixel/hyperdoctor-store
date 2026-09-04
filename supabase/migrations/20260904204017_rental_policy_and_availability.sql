create table if not exists public."ProductRentalPolicy" (
  "productId" text primary key references public."Product"(id) on delete cascade,
  "availableUnits" integer not null default 0 check ("availableUnits" >= 0),
  "dailyRate" integer check ("dailyRate" is null or "dailyRate" >= 0),
  "weeklyRate" integer check ("weeklyRate" is null or "weeklyRate" >= 0),
  "monthlyRate" integer check ("monthlyRate" is null or "monthlyRate" >= 0),
  "depositAmount" integer check ("depositAmount" is null or "depositAmount" >= 0),
  currency text not null default 'IRR',
  "minDays" integer not null default 1 check ("minDays" >= 1),
  "maxDays" integer check ("maxDays" is null or "maxDays" >= "minDays"),
  "isActive" boolean not null default true,
  "updatedAt" timestamptz not null default now()
);
alter table public."ProductRentalPolicy" enable row level security;
revoke all on public."ProductRentalPolicy" from anon, authenticated;

alter table public."RentalRequest" add column if not exists "requestedQuantity" integer not null default 1 check ("requestedQuantity" >= 1);
alter table public."RentalRequest" add column if not exists "approvedQuantity" integer check ("approvedQuantity" is null or "approvedQuantity" >= 1);
alter table public."RentalRequest" add column if not exists "approvedStartDate" date;
alter table public."RentalRequest" add column if not exists "approvedEndDate" date;
alter table public."RentalRequest" add column if not exists "quotedAmount" integer check ("quotedAmount" is null or "quotedAmount" >= 0);
alter table public."RentalRequest" add column if not exists "quotedDeposit" integer check ("quotedDeposit" is null or "quotedDeposit" >= 0);

create or replace function public.public_rental_catalog(p_product_id text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(x) order by x."nameEn",x."nameFa"),'[]'::jsonb) into v_result
  from (
    select p.id,p.slug,p."nameFa",p."nameTr",p."nameEn",p."nameAr",p."modelNumber",p."brandId",b.name as "brandName",
      rp."availableUnits",rp."dailyRate",rp."weeklyRate",rp."monthlyRate",rp."depositAmount",rp.currency,rp."minDays",rp."maxDays"
    from public."Product" p
    join public."ProductRentalPolicy" rp on rp."productId"=p.id and rp."isActive"=true
    left join public."Brand" b on b.id=p."brandId"
    where p."isPublished"=true and p."rentalEligible"=true and (p_product_id is null or p.id=p_product_id)
  ) x;
  return v_result;
end $$;
revoke all on function public.public_rental_catalog(text) from public;
grant execute on function public.public_rental_catalog(text) to anon, authenticated;

drop function if exists public.create_rental_request(uuid,text,text,text,text,date,date,text,text,text);
create or replace function public.create_rental_request(
  p_request_token uuid,p_product_id text,p_customer_name text,p_phone text,p_email text default null,
  p_preferred_start_date date default null,p_preferred_end_date date default null,p_address text default null,
  p_notes text default null,p_locale text default 'fa',p_requested_quantity integer default 1
) returns text language plpgsql security definer set search_path=public as $$
declare v_id text; v_units integer; v_reserved integer:=0;
begin
  if p_request_token is null then raise exception 'invalid request token'; end if;
  if p_requested_quantity < 1 or p_requested_quantity > 99 then raise exception 'invalid quantity'; end if;
  select rp."availableUnits" into v_units from public."Product" p join public."ProductRentalPolicy" rp on rp."productId"=p.id
   where p.id=p_product_id and p."isPublished"=true and p."rentalEligible"=true and rp."isActive"=true;
  if not found then raise exception 'product is not rental eligible'; end if;
  if p_requested_quantity>v_units then raise exception 'requested quantity exceeds rental inventory'; end if;
  if length(trim(coalesce(p_customer_name,''))) < 2 or length(trim(coalesce(p_customer_name,''))) > 120 then raise exception 'invalid customer name'; end if;
  if length(trim(coalesce(p_phone,''))) < 8 or length(trim(coalesce(p_phone,''))) > 24 then raise exception 'invalid phone'; end if;
  if p_locale not in ('fa','tr','en','ar') then raise exception 'invalid locale'; end if;
  if p_preferred_start_date is not null and p_preferred_start_date < current_date then raise exception 'invalid start date'; end if;
  if p_preferred_end_date is not null and p_preferred_start_date is not null and p_preferred_end_date < p_preferred_start_date then raise exception 'invalid date range'; end if;
  if p_preferred_start_date is not null and p_preferred_end_date is not null then
    select coalesce(sum(coalesce(r."approvedQuantity",r."requestedQuantity")),0)::int into v_reserved from public."RentalRequest" r
    where r."productId"=p_product_id and r.status='APPROVED'
      and coalesce(r."approvedStartDate",r."preferredStartDate") <= p_preferred_end_date
      and coalesce(r."approvedEndDate",r."preferredEndDate") >= p_preferred_start_date;
    if v_reserved+p_requested_quantity>v_units then raise exception 'rental inventory unavailable for selected dates'; end if;
  end if;
  if p_email is not null and length(p_email)>254 then raise exception 'invalid email'; end if;
  if p_address is not null and length(p_address)>700 then raise exception 'address too long'; end if;
  if p_notes is not null and length(p_notes)>1200 then raise exception 'notes too long'; end if;
  select id into v_id from public."RentalRequest" where "requestToken"=p_request_token;
  if v_id is not null then return v_id; end if;
  insert into public."RentalRequest"("requestToken","productId","customerName",phone,email,"preferredStartDate","preferredEndDate",address,notes,locale,"requestedQuantity")
  values(p_request_token,p_product_id,trim(p_customer_name),trim(p_phone),nullif(trim(coalesce(p_email,'')),''),p_preferred_start_date,p_preferred_end_date,nullif(trim(coalesce(p_address,'')),''),nullif(trim(coalesce(p_notes,'')),''),p_locale,p_requested_quantity)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.create_rental_request(uuid,text,text,text,text,date,date,text,text,text,integer) from public;
grant execute on function public.create_rental_request(uuid,text,text,text,text,date,date,text,text,text,integer) to anon, authenticated;

create or replace function public.admin_rental_policy_upsert(p_token text,p_product_id text,p_available_units integer,p_daily_rate integer default null,p_weekly_rate integer default null,p_monthly_rate integer default null,p_deposit_amount integer default null,p_currency text default 'IRR',p_min_days integer default 1,p_max_days integer default null,p_is_active boolean default true)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden'; end if;
 if p_available_units<0 or p_min_days<1 or (p_max_days is not null and p_max_days<p_min_days) then raise exception 'invalid rental policy'; end if;
 insert into public."ProductRentalPolicy"("productId","availableUnits","dailyRate","weeklyRate","monthlyRate","depositAmount",currency,"minDays","maxDays","isActive","updatedAt")
 values(p_product_id,p_available_units,p_daily_rate,p_weekly_rate,p_monthly_rate,p_deposit_amount,upper(coalesce(nullif(trim(p_currency),''),'IRR')),p_min_days,p_max_days,p_is_active,now())
 on conflict("productId") do update set "availableUnits"=excluded."availableUnits","dailyRate"=excluded."dailyRate","weeklyRate"=excluded."weeklyRate","monthlyRate"=excluded."monthlyRate","depositAmount"=excluded."depositAmount",currency=excluded.currency,"minDays"=excluded."minDays","maxDays"=excluded."maxDays","isActive"=excluded."isActive","updatedAt"=now();
 return true;
end $$;
revoke all on function public.admin_rental_policy_upsert(text,text,integer,integer,integer,integer,integer,text,integer,integer,boolean) from public;
grant execute on function public.admin_rental_policy_upsert(text,text,integer,integer,integer,integer,integer,text,integer,integer,boolean) to anon, authenticated;
