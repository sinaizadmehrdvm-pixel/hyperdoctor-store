create table public."RentalDocumentSnapshot"(
 id text primary key default gen_random_uuid()::text,
 "rentalRequestId" text not null references public."RentalRequest"(id) on delete cascade,
 "documentType" text not null check("documentType" in ('CONTRACT','SETTLEMENT')),
 version integer not null default 1 check(version>0),
 snapshot jsonb not null,
 sha256 text not null,
 "createdAt" timestamptz not null default now(),
 unique("rentalRequestId","documentType",version)
);
alter table public."RentalDocumentSnapshot" enable row level security;
revoke all on public."RentalDocumentSnapshot" from public,anon,authenticated;
create index "RentalDocumentSnapshot_request_idx" on public."RentalDocumentSnapshot"("rentalRequestId","documentType");

create or replace function public._rental_snapshot_payload(p_rental_request_id text)
returns jsonb language sql stable security definer set search_path='public' as $$
 select to_jsonb(x) from (
  select r.id as "rentalRequestId",r.status as "requestStatus",r."customerName",r.phone,r.email,r.address,r."approvedQuantity",r."approvedStartDate",r."approvedEndDate",r."quotedAmount",r."quotedDeposit",r."branchId",r."approvedWarehouseId",
   p.id as "productId",p.sku,p."modelNumber",p."nameFa",p."nameTr",p."nameEn",p."nameAr",b.name as "brandName",
   br.code as "branchCode",br."nameFa" as "branchNameFa",br."nameTr" as "branchNameTr",br."nameEn" as "branchNameEn",br."nameAr" as "branchNameAr",br.currency,
   w.code as "warehouseCode",w."nameFa" as "warehouseNameFa",w."nameTr" as "warehouseNameTr",w."nameEn" as "warehouseNameEn",w."nameAr" as "warehouseNameAr",
   l.id as "lifecycleId",coalesce(l.state,'APPROVED') as state,l."contractNumber",l."deviceSerials",l."handoverAt",l."handoverBy",l."handoverCondition",l."handoverAccessories",l."handoverNotes",l."depositReceived",
   l."returnedAt",l."returnedBy",l."returnCondition",l."returnAccessories",l."damageNotes",l."missingItems",l."finalRentalCharge",coalesce(l."damageCharge",0) as "damageCharge",coalesce(l."otherCharge",0) as "otherCharge",l."depositRefunded",coalesce(l."additionalPaymentReceived",0) as "additionalPaymentReceived",l."settlementReference",l."settledAt",
   (coalesce(l."finalRentalCharge",r."quotedAmount",0)+coalesce(l."damageCharge",0)+coalesce(l."otherCharge",0)-coalesce(l."depositReceived",0)+coalesce(l."depositRefunded",0)-coalesce(l."additionalPaymentReceived",0))::int as "settlementBalance"
  from public."RentalRequest" r join public."Product" p on p.id=r."productId" left join public."Brand" b on b.id=p."brandId" left join public."Branch" br on br.id=r."branchId" left join public."Warehouse" w on w.id=r."approvedWarehouseId" left join public."RentalLifecycle" l on l."rentalRequestId"=r.id where r.id=p_rental_request_id
 ) x
$$;
revoke all on function public._rental_snapshot_payload(text) from public,anon,authenticated;

create or replace function public._capture_rental_document_snapshot()
returns trigger language plpgsql security definer set search_path='public','extensions' as $$
declare v_type text; v_payload jsonb; v_hash text;
begin
 if new.state='ACTIVE' and (tg_op='INSERT' or old.state is distinct from 'ACTIVE') then v_type:='CONTRACT';
 elsif new.state='SETTLED' and (tg_op='INSERT' or old.state is distinct from 'SETTLED') then v_type:='SETTLEMENT';
 else return new; end if;
 v_payload:=public._rental_snapshot_payload(new."rentalRequestId");
 if v_payload is null then raise exception 'rental snapshot payload unavailable'; end if;
 v_hash:=encode(extensions.digest(convert_to(v_payload::text,'UTF8'),'sha256'),'hex');
 insert into public."RentalDocumentSnapshot"("rentalRequestId","documentType",version,snapshot,sha256,"createdAt") values(new."rentalRequestId",v_type,1,v_payload,v_hash,now()) on conflict("rentalRequestId","documentType",version) do nothing;
 return new;
end $$;
revoke all on function public._capture_rental_document_snapshot() from public,anon,authenticated;

drop trigger if exists "rental_document_snapshot_capture" on public."RentalLifecycle";
create trigger "rental_document_snapshot_capture" after insert or update of state on public."RentalLifecycle" for each row execute function public._capture_rental_document_snapshot();

create or replace function public.admin_rental_document_snapshot(p_token text,p_rental_request_id text,p_document_type text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 if p_document_type not in ('CONTRACT','SETTLEMENT') then raise exception 'invalid document type'; end if;
 select jsonb_build_object('documentType',"documentType",'version',version,'sha256',sha256,'createdAt',"createdAt",'snapshot',snapshot) into v_result from public."RentalDocumentSnapshot" where "rentalRequestId"=p_rental_request_id and "documentType"=p_document_type order by version desc limit 1;
 return v_result;
end $$;
revoke all on function public.admin_rental_document_snapshot(text,text,text) from public;
grant execute on function public.admin_rental_document_snapshot(text,text,text) to anon,authenticated;
