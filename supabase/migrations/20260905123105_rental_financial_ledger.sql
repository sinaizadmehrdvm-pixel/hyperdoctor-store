create table public."RentalFinancialEntry"(
 id text primary key default gen_random_uuid()::text,
 "rentalRequestId" text not null references public."RentalRequest"(id) on delete cascade,
 "entryKey" text not null,
 "entryType" text not null check("entryType" in ('DEPOSIT_RECEIVED','FINAL_RENTAL_CHARGE','DAMAGE_CHARGE','OTHER_CHARGE','DEPOSIT_REFUNDED','ADDITIONAL_PAYMENT_RECEIVED')),
 "cashDirection" text not null check("cashDirection" in ('IN','OUT','NON_CASH')),
 amount integer not null check(amount>=0),
 currency text not null,
 reference text,
 "occurredAt" timestamptz not null,
 "createdByAdminId" text references public."AdminUser"(id) on delete set null,
 "createdAt" timestamptz not null default now(),
 unique("rentalRequestId","entryKey")
);
alter table public."RentalFinancialEntry" enable row level security;
revoke all on public."RentalFinancialEntry" from public,anon,authenticated;
create index "RentalFinancialEntry_rentalRequestId_occurredAt_idx" on public."RentalFinancialEntry"("rentalRequestId","occurredAt" desc);

create or replace function public.admin_rental_financial_entries(p_token text,p_rental_request_id text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x."occurredAt",x."createdAt"),'[]'::jsonb) into v_result from (
  select id,"entryKey","entryType","cashDirection",amount,currency,reference,"occurredAt","createdAt" from public."RentalFinancialEntry" where "rentalRequestId"=p_rental_request_id
 ) x;
 return v_result;
end $$;
revoke all on function public.admin_rental_financial_entries(text,text) from public;
grant execute on function public.admin_rental_financial_entries(text,text) to anon,authenticated;

create or replace function public.admin_rental_record_handover(p_token text,p_rental_request_id text,p_device_serials text default null,p_handover_by text default null,p_handover_condition text default null,p_handover_accessories text default null,p_handover_notes text default null,p_deposit_received integer default 0,p_handover_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_r public."RentalRequest"%rowtype; v_contract text; v_state text; v_currency text; v_at timestamptz;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 if coalesce(p_deposit_received,0)<0 then raise exception 'invalid deposit'; end if;
 select * into v_r from public."RentalRequest" where id=p_rental_request_id for update; if not found then raise exception 'rental request not found'; end if;
 if v_r.status<>'APPROVED' or v_r."approvedWarehouseId" is null or v_r."approvedQuantity" is null or v_r."approvedStartDate" is null or v_r."approvedEndDate" is null then raise exception 'rental must be approved and allocated before handover'; end if;
 select state into v_state from public."RentalLifecycle" where "rentalRequestId"=p_rental_request_id for update;
 if v_state in ('ACTIVE','RETURNED','SETTLED') then raise exception 'handover already recorded'; end if;
 select coalesce(br.currency,pr.currency,'IRT') into v_currency from public."ProductRentalPolicy" pr left join public."Branch" br on br.id=v_r."branchId" where pr."productId"=v_r."productId";
 v_currency:=coalesce(v_currency,'IRT'); v_at:=coalesce(p_handover_at,now());
 v_contract:='HD-RNT-'||to_char(v_at,'YYYYMMDD')||'-'||upper(substr(replace(v_r.id,'-',''),1,8));
 insert into public."RentalLifecycle"("rentalRequestId",state,"contractNumber","deviceSerials","handoverAt","handoverBy","handoverCondition","handoverAccessories","handoverNotes","depositReceived","updatedAt")
 values(v_r.id,'ACTIVE',v_contract,left(nullif(btrim(coalesce(p_device_serials,'')),''),2000),v_at,left(nullif(btrim(coalesce(p_handover_by,'')),''),240),left(nullif(btrim(coalesce(p_handover_condition,'')),''),4000),left(nullif(btrim(coalesce(p_handover_accessories,'')),''),4000),left(nullif(btrim(coalesce(p_handover_notes,'')),''),4000),coalesce(p_deposit_received,0),now())
 on conflict("rentalRequestId") do update set state='ACTIVE',"contractNumber"=coalesce(public."RentalLifecycle"."contractNumber",excluded."contractNumber"),"deviceSerials"=excluded."deviceSerials","handoverAt"=excluded."handoverAt","handoverBy"=excluded."handoverBy","handoverCondition"=excluded."handoverCondition","handoverAccessories"=excluded."handoverAccessories","handoverNotes"=excluded."handoverNotes","depositReceived"=excluded."depositReceived","updatedAt"=now();
 if coalesce(p_deposit_received,0)>0 then insert into public."RentalFinancialEntry"("rentalRequestId","entryKey","entryType","cashDirection",amount,currency,reference,"occurredAt","createdByAdminId") values(v_r.id,'HANDOVER_DEPOSIT','DEPOSIT_RECEIVED','IN',p_deposit_received,v_currency,v_contract,v_at,v_admin.id) on conflict("rentalRequestId","entryKey") do nothing; end if;
 return public.admin_rental_lifecycle_detail(p_token,p_rental_request_id);
end $$;

create or replace function public.admin_rental_settlement(p_token text,p_rental_request_id text,p_final_rental_charge integer default null,p_damage_charge integer default 0,p_other_charge integer default 0,p_deposit_refunded integer default 0,p_additional_payment_received integer default 0,p_settlement_reference text default null,p_settled_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_state text; v_deposit int; v_quote int; v_final int; v_balance int; v_currency text; v_product_id text; v_branch_id text; v_at timestamptz; v_ref text;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 if coalesce(p_damage_charge,0)<0 or coalesce(p_other_charge,0)<0 or coalesce(p_deposit_refunded,0)<0 or coalesce(p_additional_payment_received,0)<0 or (p_final_rental_charge is not null and p_final_rental_charge<0) then raise exception 'invalid settlement values'; end if;
 select l.state,coalesce(l."depositReceived",0),coalesce(r."quotedAmount",0),r."productId",r."branchId" into v_state,v_deposit,v_quote,v_product_id,v_branch_id from public."RentalLifecycle" l join public."RentalRequest" r on r.id=l."rentalRequestId" where l."rentalRequestId"=p_rental_request_id for update of l;
 if not found then raise exception 'rental lifecycle not found'; end if; if v_state<>'RETURNED' then raise exception 'rental must be returned before settlement'; end if;
 if coalesce(p_deposit_refunded,0)>v_deposit then raise exception 'deposit refund exceeds received deposit'; end if;
 v_final:=coalesce(p_final_rental_charge,v_quote); v_balance:=v_final+coalesce(p_damage_charge,0)+coalesce(p_other_charge,0)-v_deposit+coalesce(p_deposit_refunded,0)-coalesce(p_additional_payment_received,0);
 if v_balance<>0 then raise exception 'settlement balance must be zero'; end if;
 select coalesce(br.currency,pr.currency,'IRT') into v_currency from public."ProductRentalPolicy" pr left join public."Branch" br on br.id=v_branch_id where pr."productId"=v_product_id; v_currency:=coalesce(v_currency,'IRT');
 v_at:=coalesce(p_settled_at,now()); v_ref:=left(nullif(btrim(coalesce(p_settlement_reference,'')),''),500);
 update public."RentalLifecycle" set state='SETTLED',"finalRentalCharge"=v_final,"damageCharge"=coalesce(p_damage_charge,0),"otherCharge"=coalesce(p_other_charge,0),"depositRefunded"=coalesce(p_deposit_refunded,0),"additionalPaymentReceived"=coalesce(p_additional_payment_received,0),"settlementReference"=v_ref,"settledAt"=v_at,"updatedAt"=now() where "rentalRequestId"=p_rental_request_id;
 update public."RentalRequest" set status='CLOSED',"updatedAt"=now() where id=p_rental_request_id;
 insert into public."RentalFinancialEntry"("rentalRequestId","entryKey","entryType","cashDirection",amount,currency,reference,"occurredAt","createdByAdminId") values
 (p_rental_request_id,'SETTLEMENT_RENTAL','FINAL_RENTAL_CHARGE','NON_CASH',v_final,v_currency,v_ref,v_at,v_admin.id),
 (p_rental_request_id,'SETTLEMENT_DAMAGE','DAMAGE_CHARGE','NON_CASH',coalesce(p_damage_charge,0),v_currency,v_ref,v_at,v_admin.id),
 (p_rental_request_id,'SETTLEMENT_OTHER','OTHER_CHARGE','NON_CASH',coalesce(p_other_charge,0),v_currency,v_ref,v_at,v_admin.id),
 (p_rental_request_id,'SETTLEMENT_DEPOSIT_REFUND','DEPOSIT_REFUNDED','OUT',coalesce(p_deposit_refunded,0),v_currency,v_ref,v_at,v_admin.id),
 (p_rental_request_id,'SETTLEMENT_ADDITIONAL','ADDITIONAL_PAYMENT_RECEIVED','IN',coalesce(p_additional_payment_received,0),v_currency,v_ref,v_at,v_admin.id)
 on conflict("rentalRequestId","entryKey") do nothing;
 return public.admin_rental_lifecycle_detail(p_token,p_rental_request_id);
end $$;
revoke all on function public.admin_rental_record_handover(text,text,text,text,text,text,text,integer,timestamptz) from public;
revoke all on function public.admin_rental_settlement(text,text,integer,integer,integer,integer,integer,text,timestamptz) from public;
grant execute on function public.admin_rental_record_handover(text,text,text,text,text,text,text,integer,timestamptz) to anon,authenticated;
grant execute on function public.admin_rental_settlement(text,text,integer,integer,integer,integer,integer,text,timestamptz) to anon,authenticated;
