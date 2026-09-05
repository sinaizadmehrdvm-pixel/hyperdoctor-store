create table if not exists public."RentalLifecycle" (
  id text primary key default (gen_random_uuid())::text,
  "rentalRequestId" text not null unique references public."RentalRequest"(id) on delete cascade,
  state text not null default 'APPROVED' check (state in ('APPROVED','ACTIVE','RETURNED','SETTLED','CANCELLED')),
  "contractNumber" text unique,
  "deviceSerials" text,
  "handoverAt" timestamptz,
  "handoverBy" text,
  "handoverCondition" text,
  "handoverAccessories" text,
  "handoverNotes" text,
  "depositReceived" integer check ("depositReceived" is null or "depositReceived" >= 0),
  "returnedAt" timestamptz,
  "returnedBy" text,
  "returnCondition" text,
  "returnAccessories" text,
  "damageNotes" text,
  "missingItems" text,
  "finalRentalCharge" integer check ("finalRentalCharge" is null or "finalRentalCharge" >= 0),
  "damageCharge" integer not null default 0 check ("damageCharge" >= 0),
  "otherCharge" integer not null default 0 check ("otherCharge" >= 0),
  "depositRefunded" integer check ("depositRefunded" is null or "depositRefunded" >= 0),
  "additionalPaymentReceived" integer not null default 0 check ("additionalPaymentReceived" >= 0),
  "settlementReference" text,
  "settledAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
alter table public."RentalLifecycle" enable row level security;
revoke all on table public."RentalLifecycle" from public, anon, authenticated;
create index if not exists "RentalLifecycle_state_idx" on public."RentalLifecycle"(state);
create index if not exists "RentalLifecycle_returnedAt_idx" on public."RentalLifecycle"("returnedAt");

create or replace function public._rental_effective_end(p_request_id text)
returns date language sql stable security invoker set search_path='public' as $$
  select case
    when l.state in ('RETURNED','SETTLED') and l."returnedAt" is not null then least(coalesce(r."approvedEndDate",r."preferredEndDate"), l."returnedAt"::date)
    when l.state='ACTIVE' and coalesce(r."approvedEndDate",r."preferredEndDate") < current_date then date '9999-12-31'
    else coalesce(r."approvedEndDate",r."preferredEndDate")
  end
  from public."RentalRequest" r left join public."RentalLifecycle" l on l."rentalRequestId"=r.id
  where r.id=p_request_id
$$;
revoke all on function public._rental_effective_end(text) from public, anon, authenticated;

create or replace function public.admin_rental_lifecycle_detail(p_token text,p_rental_request_id text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 select to_jsonb(x) into v_result from (
  select r.id as "rentalRequestId",r.status as "requestStatus",r."customerName",r.phone,r.email,r.address,r."approvedQuantity",r."approvedStartDate",r."approvedEndDate",r."quotedAmount",r."quotedDeposit",r."branchId",r."approvedWarehouseId",
   p.id as "productId",p.sku,p."modelNumber",p."nameFa",p."nameTr",p."nameEn",p."nameAr",b.name as "brandName",
   br.code as "branchCode",br."nameFa" as "branchNameFa",br."nameTr" as "branchNameTr",br."nameEn" as "branchNameEn",br."nameAr" as "branchNameAr",br.currency,
   w.code as "warehouseCode",w."nameFa" as "warehouseNameFa",w."nameTr" as "warehouseNameTr",w."nameEn" as "warehouseNameEn",w."nameAr" as "warehouseNameAr",
   l.id as "lifecycleId",coalesce(l.state,'APPROVED') as state,l."contractNumber",l."deviceSerials",l."handoverAt",l."handoverBy",l."handoverCondition",l."handoverAccessories",l."handoverNotes",l."depositReceived",
   l."returnedAt",l."returnedBy",l."returnCondition",l."returnAccessories",l."damageNotes",l."missingItems",l."finalRentalCharge",coalesce(l."damageCharge",0) as "damageCharge",coalesce(l."otherCharge",0) as "otherCharge",l."depositRefunded",coalesce(l."additionalPaymentReceived",0) as "additionalPaymentReceived",l."settlementReference",l."settledAt",
   (coalesce(l."finalRentalCharge",r."quotedAmount",0)+coalesce(l."damageCharge",0)+coalesce(l."otherCharge",0)-coalesce(l."depositReceived",0)+coalesce(l."depositRefunded",0)-coalesce(l."additionalPaymentReceived",0))::int as "settlementBalance"
  from public."RentalRequest" r join public."Product" p on p.id=r."productId"
  left join public."Brand" b on b.id=p."brandId" left join public."Branch" br on br.id=r."branchId" left join public."Warehouse" w on w.id=r."approvedWarehouseId"
  left join public."RentalLifecycle" l on l."rentalRequestId"=r.id where r.id=p_rental_request_id
 ) x;
 if v_result is null then raise exception 'rental request not found'; end if; return v_result;
end $$;
revoke all on function public.admin_rental_lifecycle_detail(text,text) from public;
grant execute on function public.admin_rental_lifecycle_detail(text,text) to anon,authenticated;

create or replace function public.admin_rental_record_handover(p_token text,p_rental_request_id text,p_device_serials text default null,p_handover_by text default null,p_handover_condition text default null,p_handover_accessories text default null,p_handover_notes text default null,p_deposit_received integer default 0,p_handover_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_r public."RentalRequest"%rowtype; v_contract text; v_state text;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 if coalesce(p_deposit_received,0)<0 then raise exception 'invalid deposit'; end if;
 select * into v_r from public."RentalRequest" where id=p_rental_request_id for update; if not found then raise exception 'rental request not found'; end if;
 if v_r.status<>'APPROVED' or v_r."approvedWarehouseId" is null or v_r."approvedQuantity" is null or v_r."approvedStartDate" is null or v_r."approvedEndDate" is null then raise exception 'rental must be approved and allocated before handover'; end if;
 select state into v_state from public."RentalLifecycle" where "rentalRequestId"=p_rental_request_id for update;
 if v_state in ('ACTIVE','RETURNED','SETTLED') then raise exception 'handover already recorded'; end if;
 v_contract:='HD-RNT-'||to_char(coalesce(p_handover_at,now()),'YYYYMMDD')||'-'||upper(substr(replace(v_r.id,'-',''),1,8));
 insert into public."RentalLifecycle"("rentalRequestId",state,"contractNumber","deviceSerials","handoverAt","handoverBy","handoverCondition","handoverAccessories","handoverNotes","depositReceived","updatedAt")
 values(v_r.id,'ACTIVE',v_contract,left(nullif(btrim(coalesce(p_device_serials,'')),''),2000),coalesce(p_handover_at,now()),left(nullif(btrim(coalesce(p_handover_by,'')),''),240),left(nullif(btrim(coalesce(p_handover_condition,'')),''),4000),left(nullif(btrim(coalesce(p_handover_accessories,'')),''),4000),left(nullif(btrim(coalesce(p_handover_notes,'')),''),4000),coalesce(p_deposit_received,0),now())
 on conflict("rentalRequestId") do update set state='ACTIVE',"contractNumber"=coalesce(public."RentalLifecycle"."contractNumber",excluded."contractNumber"),"deviceSerials"=excluded."deviceSerials","handoverAt"=excluded."handoverAt","handoverBy"=excluded."handoverBy","handoverCondition"=excluded."handoverCondition","handoverAccessories"=excluded."handoverAccessories","handoverNotes"=excluded."handoverNotes","depositReceived"=excluded."depositReceived","updatedAt"=now();
 return public.admin_rental_lifecycle_detail(p_token,p_rental_request_id);
end $$;
revoke all on function public.admin_rental_record_handover(text,text,text,text,text,text,text,integer,timestamptz) from public;
grant execute on function public.admin_rental_record_handover(text,text,text,text,text,text,text,integer,timestamptz) to anon,authenticated;

create or replace function public.admin_rental_record_return(p_token text,p_rental_request_id text,p_returned_by text default null,p_return_condition text default null,p_return_accessories text default null,p_damage_notes text default null,p_missing_items text default null,p_returned_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_state text;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 select state into v_state from public."RentalLifecycle" where "rentalRequestId"=p_rental_request_id for update; if not found then raise exception 'handover not recorded'; end if;
 if v_state<>'ACTIVE' then raise exception 'only active rental can be returned'; end if;
 update public."RentalLifecycle" set state='RETURNED',"returnedAt"=coalesce(p_returned_at,now()),"returnedBy"=left(nullif(btrim(coalesce(p_returned_by,'')),''),240),"returnCondition"=left(nullif(btrim(coalesce(p_return_condition,'')),''),4000),"returnAccessories"=left(nullif(btrim(coalesce(p_return_accessories,'')),''),4000),"damageNotes"=left(nullif(btrim(coalesce(p_damage_notes,'')),''),4000),"missingItems"=left(nullif(btrim(coalesce(p_missing_items,'')),''),4000),"updatedAt"=now() where "rentalRequestId"=p_rental_request_id;
 return public.admin_rental_lifecycle_detail(p_token,p_rental_request_id);
end $$;
revoke all on function public.admin_rental_record_return(text,text,text,text,text,text,text,timestamptz) from public;
grant execute on function public.admin_rental_record_return(text,text,text,text,text,text,text,timestamptz) to anon,authenticated;

create or replace function public.admin_rental_settlement(p_token text,p_rental_request_id text,p_final_rental_charge integer default null,p_damage_charge integer default 0,p_other_charge integer default 0,p_deposit_refunded integer default 0,p_additional_payment_received integer default 0,p_settlement_reference text default null,p_settled_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_state text; v_deposit int; v_quote int; v_final int; v_balance int;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 if coalesce(p_damage_charge,0)<0 or coalesce(p_other_charge,0)<0 or coalesce(p_deposit_refunded,0)<0 or coalesce(p_additional_payment_received,0)<0 or (p_final_rental_charge is not null and p_final_rental_charge<0) then raise exception 'invalid settlement values'; end if;
 select l.state,coalesce(l."depositReceived",0),coalesce(r."quotedAmount",0) into v_state,v_deposit,v_quote from public."RentalLifecycle" l join public."RentalRequest" r on r.id=l."rentalRequestId" where l."rentalRequestId"=p_rental_request_id for update of l;
 if not found then raise exception 'rental lifecycle not found'; end if; if v_state<>'RETURNED' then raise exception 'rental must be returned before settlement'; end if;
 if coalesce(p_deposit_refunded,0)>v_deposit then raise exception 'deposit refund exceeds received deposit'; end if;
 v_final:=coalesce(p_final_rental_charge,v_quote); v_balance:=v_final+coalesce(p_damage_charge,0)+coalesce(p_other_charge,0)-v_deposit+coalesce(p_deposit_refunded,0)-coalesce(p_additional_payment_received,0);
 if v_balance<>0 then raise exception 'settlement balance must be zero'; end if;
 update public."RentalLifecycle" set state='SETTLED',"finalRentalCharge"=v_final,"damageCharge"=coalesce(p_damage_charge,0),"otherCharge"=coalesce(p_other_charge,0),"depositRefunded"=coalesce(p_deposit_refunded,0),"additionalPaymentReceived"=coalesce(p_additional_payment_received,0),"settlementReference"=left(nullif(btrim(coalesce(p_settlement_reference,'')),''),500),"settledAt"=coalesce(p_settled_at,now()),"updatedAt"=now() where "rentalRequestId"=p_rental_request_id;
 update public."RentalRequest" set status='CLOSED',"updatedAt"=now() where id=p_rental_request_id;
 return public.admin_rental_lifecycle_detail(p_token,p_rental_request_id);
end $$;
revoke all on function public.admin_rental_settlement(text,text,integer,integer,integer,integer,integer,text,timestamptz) from public;
grant execute on function public.admin_rental_settlement(text,text,integer,integer,integer,integer,integer,text,timestamptz) to anon,authenticated;

create or replace function public.create_rental_request_v2(p_request_token uuid, p_product_id text, p_customer_name text, p_phone text, p_email text default null, p_preferred_start_date date default null, p_preferred_end_date date default null, p_address text default null, p_notes text default null, p_locale text default 'fa', p_requested_quantity integer default 1, p_branch_id text default null)
returns text language plpgsql security definer set search_path='public' as $$
declare v_id text; v_branch_id text; v_units int; v_reserved int:=0;
begin
 v_branch_id:=nullif(btrim(coalesce(p_branch_id,'')),'');
 if v_branch_id is null then select b.id into v_branch_id from public."Branch" b where b."isPublished"=true and exists(select 1 from public."Warehouse" w where w."branchId"=b.id and w."isActive"=true) order by b."isDefault" desc,b."createdAt" asc limit 1; end if;
 if v_branch_id is null then return public.create_rental_request(p_request_token,p_product_id,p_customer_name,p_phone,p_email,p_preferred_start_date,p_preferred_end_date,p_address,p_notes,p_locale,p_requested_quantity); end if;
 if not exists(select 1 from public."Branch" where id=v_branch_id and "isPublished"=true) then raise exception 'branch unavailable'; end if;
 select case when exists(select 1 from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch_id and w."isActive"=true and i."productId"=p_product_id) then (select coalesce(sum(i."rentalUnits"),0)::int from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch_id and w."isActive"=true and i."productId"=p_product_id) else rp."availableUnits" end into v_units from public."Product" p join public."ProductRentalPolicy" rp on rp."productId"=p.id and rp."isActive"=true where p.id=p_product_id and p."isPublished"=true and p."rentalEligible"=true;
 if not found or v_units<1 then raise exception 'product is not rental eligible at branch'; end if; if p_requested_quantity>v_units then raise exception 'requested quantity exceeds branch rental inventory'; end if;
 if p_preferred_start_date is not null and p_preferred_end_date is not null then
  select coalesce(sum(coalesce(r."approvedQuantity",r."requestedQuantity")),0)::int into v_reserved from public."RentalRequest" r where r."productId"=p_product_id and r.status='APPROVED' and (r."branchId"=v_branch_id or r."branchId" is null) and coalesce(r."approvedStartDate",r."preferredStartDate")<=p_preferred_end_date and public._rental_effective_end(r.id)>=p_preferred_start_date;
  if v_reserved+p_requested_quantity>v_units then raise exception 'rental inventory unavailable for selected branch dates'; end if;
 end if;
 v_id:=public.create_rental_request(p_request_token,p_product_id,p_customer_name,p_phone,p_email,p_preferred_start_date,p_preferred_end_date,p_address,p_notes,p_locale,p_requested_quantity);
 update public."RentalRequest" set "branchId"=coalesce("branchId",v_branch_id),"updatedAt"=now() where id=v_id and ("branchId" is null or "branchId"=v_branch_id); if not found then raise exception 'rental request branch mismatch'; end if; return v_id;
end $$;
revoke all on function public.create_rental_request_v2(uuid,text,text,text,text,date,date,text,text,text,integer,text) from public;
grant execute on function public.create_rental_request_v2(uuid,text,text,text,text,date,date,text,text,text,integer,text) to anon,authenticated;

create or replace function public.admin_update_rental_request_v3(p_token text,p_id text,p_status text,p_admin_notes text default null,p_approved_quantity integer default null,p_approved_start_date date default null,p_approved_end_date date default null,p_quoted_amount integer default null,p_quoted_deposit integer default null,p_approved_warehouse_id text default null)
returns boolean language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_product_id text; v_branch_id text; v_wh text; v_qty int; v_start date; v_end date; v_capacity int; v_reserved int;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 if exists(select 1 from public."RentalLifecycle" l where l."rentalRequestId"=p_id and l.state in ('ACTIVE','RETURNED','SETTLED')) then raise exception 'approved rental lifecycle must be managed from handover/return/settlement'; end if;
 select r."productId",r."branchId",coalesce(p_approved_quantity,r."requestedQuantity"),coalesce(p_approved_start_date,r."preferredStartDate"),coalesce(p_approved_end_date,r."preferredEndDate") into v_product_id,v_branch_id,v_qty,v_start,v_end from public."RentalRequest" r where r.id=p_id; if not found then raise exception 'rental request not found'; end if;
 if v_branch_id is null or p_status<>'APPROVED' then return public.admin_update_rental_request_v2(p_token,p_id,p_status,p_admin_notes,p_approved_quantity,p_approved_start_date,p_approved_end_date,p_quoted_amount,p_quoted_deposit); end if;
 if v_qty is null or v_qty<1 or v_start is null or v_end is null or v_end<v_start then raise exception 'approval requires valid quantity and dates'; end if;
 v_wh:=nullif(btrim(coalesce(p_approved_warehouse_id,'')),''); if v_wh is not null and not exists(select 1 from public."Warehouse" where id=v_wh and "branchId"=v_branch_id and "isActive"=true) then raise exception 'warehouse unavailable'; end if;
 if v_wh is null then
  for v_wh,v_capacity in select w.id,i."rentalUnits" from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id and i."productId"=v_product_id where w."branchId"=v_branch_id and w."isActive"=true order by i."rentalUnits" desc,w.code loop
   select coalesce(sum(coalesce(r."approvedQuantity",r."requestedQuantity")),0)::int into v_reserved from public."RentalRequest" r where r."approvedWarehouseId"=v_wh and r.status='APPROVED' and r.id<>p_id and coalesce(r."approvedStartDate",r."preferredStartDate")<=v_end and public._rental_effective_end(r.id)>=v_start;
   if v_capacity-v_reserved>=v_qty then exit; end if; v_wh:=null;
  end loop;
 else
  select i."rentalUnits" into v_capacity from public."WarehouseInventory" i where i."warehouseId"=v_wh and i."productId"=v_product_id; if not found then raise exception 'warehouse rental inventory unavailable'; end if;
  select coalesce(sum(coalesce(r."approvedQuantity",r."requestedQuantity")),0)::int into v_reserved from public."RentalRequest" r where r."approvedWarehouseId"=v_wh and r.status='APPROVED' and r.id<>p_id and coalesce(r."approvedStartDate",r."preferredStartDate")<=v_end and public._rental_effective_end(r.id)>=v_start;
  if v_capacity-v_reserved<v_qty then raise exception 'warehouse rental inventory unavailable'; end if;
 end if;
 if v_wh is null then raise exception 'warehouse rental inventory unavailable'; end if;
 perform public.admin_update_rental_request_v2(p_token,p_id,p_status,p_admin_notes,p_approved_quantity,p_approved_start_date,p_approved_end_date,p_quoted_amount,p_quoted_deposit);
 update public."RentalRequest" set "approvedWarehouseId"=v_wh,"updatedAt"=now() where id=p_id;
 insert into public."RentalLifecycle"("rentalRequestId",state,"updatedAt") values(p_id,'APPROVED',now()) on conflict("rentalRequestId") do update set state='APPROVED',"updatedAt"=now();
 return true;
end $$;
revoke all on function public.admin_update_rental_request_v3(text,text,text,text,integer,date,date,integer,integer,text) from public;
grant execute on function public.admin_update_rental_request_v3(text,text,text,text,integer,date,date,integer,integer,text) to anon,authenticated;
