create table if not exists public."RentalRequest" (
  id text primary key default gen_random_uuid()::text,
  "requestToken" uuid not null unique,
  "productId" text not null references public."Product"(id) on delete restrict,
  "customerName" text not null,
  phone text not null,
  email text,
  "preferredStartDate" date,
  "preferredEndDate" date,
  address text,
  notes text,
  locale text not null default 'fa',
  status text not null default 'NEW' check (status in ('NEW','CONTACTED','APPROVED','REJECTED','CLOSED')),
  "adminNotes" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index if not exists "RentalRequest_createdAt_idx" on public."RentalRequest" ("createdAt" desc);
create index if not exists "RentalRequest_status_idx" on public."RentalRequest" (status);
create index if not exists "RentalRequest_productId_idx" on public."RentalRequest" ("productId");
alter table public."RentalRequest" enable row level security;
revoke all on public."RentalRequest" from anon, authenticated;

create or replace function public.create_rental_request(
  p_request_token uuid,
  p_product_id text,
  p_customer_name text,
  p_phone text,
  p_email text default null,
  p_preferred_start_date date default null,
  p_preferred_end_date date default null,
  p_address text default null,
  p_notes text default null,
  p_locale text default 'fa'
) returns text
language plpgsql security definer set search_path=public as $$
declare v_id text; v_product public."Product"%rowtype;
begin
  if p_request_token is null then raise exception 'invalid request token'; end if;
  select * into v_product from public."Product" where id=p_product_id and "isPublished"=true and "rentalEligible"=true;
  if not found then raise exception 'product is not rental eligible'; end if;
  if length(trim(coalesce(p_customer_name,''))) < 2 or length(trim(coalesce(p_customer_name,''))) > 120 then raise exception 'invalid customer name'; end if;
  if length(trim(coalesce(p_phone,''))) < 8 or length(trim(coalesce(p_phone,''))) > 24 then raise exception 'invalid phone'; end if;
  if p_email is not null and length(p_email)>254 then raise exception 'invalid email'; end if;
  if p_address is not null and length(p_address)>700 then raise exception 'address too long'; end if;
  if p_notes is not null and length(p_notes)>1200 then raise exception 'notes too long'; end if;
  if p_locale not in ('fa','tr','en','ar') then raise exception 'invalid locale'; end if;
  if p_preferred_start_date is not null and p_preferred_start_date < current_date then raise exception 'invalid start date'; end if;
  if p_preferred_end_date is not null and p_preferred_start_date is not null and p_preferred_end_date < p_preferred_start_date then raise exception 'invalid date range'; end if;
  select id into v_id from public."RentalRequest" where "requestToken"=p_request_token;
  if v_id is not null then return v_id; end if;
  insert into public."RentalRequest"("requestToken","productId","customerName",phone,email,"preferredStartDate","preferredEndDate",address,notes,locale)
  values(p_request_token,p_product_id,trim(p_customer_name),trim(p_phone),nullif(trim(coalesce(p_email,'')),''),p_preferred_start_date,p_preferred_end_date,nullif(trim(coalesce(p_address,'')),''),nullif(trim(coalesce(p_notes,'')),''),p_locale)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.create_rental_request(uuid,text,text,text,text,date,date,text,text,text) from public;
grant execute on function public.create_rental_request(uuid,text,text,text,text,date,date,text,text,text) to anon, authenticated;

create or replace function public.admin_rental_requests(p_token text, p_search text default null, p_status text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SUPPORT'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x."createdAt" desc),'[]'::jsonb) into v_result
  from (
    select r.id,r."productId",r."customerName",r.phone,r.email,r."preferredStartDate",r."preferredEndDate",r.address,r.notes,r.locale,r.status,r."adminNotes",r."createdAt",r."updatedAt",
      p.slug,p."nameFa",p."nameTr",p."nameEn",p."nameAr",b.name as "brandName"
    from public."RentalRequest" r
    join public."Product" p on p.id=r."productId"
    left join public."Brand" b on b.id=p."brandId"
    where (p_status is null or p_status='' or r.status=p_status)
      and (p_search is null or trim(p_search)='' or concat_ws(' ',r.id,r."customerName",r.phone,r.email,p."nameFa",p."nameTr",p."nameEn",p."nameAr",p.sku,b.name) ilike '%'||trim(p_search)||'%')
    limit 300
  ) x;
  return v_result;
end $$;
revoke all on function public.admin_rental_requests(text,text,text) from public;
grant execute on function public.admin_rental_requests(text,text,text) to anon, authenticated;

create or replace function public.admin_update_rental_request(p_token text,p_id text,p_status text,p_admin_notes text default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SUPPORT'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden'; end if;
  if p_status not in ('NEW','CONTACTED','APPROVED','REJECTED','CLOSED') then raise exception 'invalid status'; end if;
  if p_admin_notes is not null and length(p_admin_notes)>2000 then raise exception 'notes too long'; end if;
  update public."RentalRequest" set status=p_status,"adminNotes"=nullif(trim(coalesce(p_admin_notes,'')),''),"updatedAt"=now() where id=p_id;
  if not found then raise exception 'rental request not found'; end if;
  return true;
end $$;
revoke all on function public.admin_update_rental_request(text,text,text,text) from public;
grant execute on function public.admin_update_rental_request(text,text,text,text) to anon, authenticated;
