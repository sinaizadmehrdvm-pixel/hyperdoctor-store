create or replace function public.admin_transactions_v2(p_token text,p_search text default '')
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x."createdAt" desc),'[]'::jsonb) into v_result from (
  select 'ORDER'::text as source,o.id as "entityId",o."orderNumber" as "referenceNumber",o."customerName",o.total as amount,o.currency,o.status::text as status,o.gateway::text as method,o."paymentRefId" as reference,o."createdAt"
  from public."Order" o
  where coalesce(p_search,'')='' or concat_ws(' ',o."orderNumber",o."customerName",o."paymentRefId",o.gateway::text,o.status::text,o.currency) ilike '%'||trim(p_search)||'%'
  union all
  select 'RENTAL'::text,e."rentalRequestId",coalesce(l."contractNumber",e."rentalRequestId"),r."customerName",e.amount,e.currency,e."entryType",e."cashDirection",e.reference,e."occurredAt"
  from public."RentalFinancialEntry" e join public."RentalRequest" r on r.id=e."rentalRequestId" left join public."RentalLifecycle" l on l."rentalRequestId"=e."rentalRequestId"
  where coalesce(p_search,'')='' or concat_ws(' ',e."rentalRequestId",l."contractNumber",r."customerName",e."entryType",e."cashDirection",e.reference,e.currency) ilike '%'||trim(p_search)||'%'
  order by "createdAt" desc limit 700
 ) x; return v_result;
end $$;
revoke all on function public.admin_transactions_v2(text,text) from public;
grant execute on function public.admin_transactions_v2(text,text) to anon,authenticated;

create or replace function public.admin_rental_document_verify(p_token text,p_rental_request_id text,p_document_type text)
returns jsonb language plpgsql security definer set search_path='public','extensions' as $$
declare v_admin public."AdminUser"%rowtype; v_doc public."RentalDocumentSnapshot"%rowtype; v_actual text;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 if p_document_type not in ('CONTRACT','SETTLEMENT') then raise exception 'invalid document type'; end if;
 select * into v_doc from public."RentalDocumentSnapshot" where "rentalRequestId"=p_rental_request_id and "documentType"=p_document_type order by version desc limit 1;
 if not found then return null; end if;
 v_actual:=encode(extensions.digest(convert_to(v_doc.snapshot::text,'UTF8'),'sha256'),'hex');
 return jsonb_build_object('documentType',v_doc."documentType",'version',v_doc.version,'storedSha256',v_doc.sha256,'actualSha256',v_actual,'valid',v_actual=v_doc.sha256,'createdAt',v_doc."createdAt");
end $$;
revoke all on function public.admin_rental_document_verify(text,text,text) from public;
grant execute on function public.admin_rental_document_verify(text,text,text) to anon,authenticated;

create or replace function public.admin_rental_financial_reconciliation(p_token text,p_rental_request_id text default null)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x."rentalRequestId"),'[]'::jsonb) into v_result from (
  select r.id as "rentalRequestId",l."contractNumber",r."customerName",coalesce(br.currency,pr.currency,'IRT') as currency,l.state,
   coalesce(l."depositReceived",0) as "expectedDepositReceived",coalesce(sum(e.amount) filter(where e."entryType"='DEPOSIT_RECEIVED'),0)::int as "ledgerDepositReceived",
   coalesce(l."finalRentalCharge",0) as "expectedFinalRentalCharge",coalesce(sum(e.amount) filter(where e."entryType"='FINAL_RENTAL_CHARGE'),0)::int as "ledgerFinalRentalCharge",
   coalesce(l."damageCharge",0) as "expectedDamageCharge",coalesce(sum(e.amount) filter(where e."entryType"='DAMAGE_CHARGE'),0)::int as "ledgerDamageCharge",
   coalesce(l."otherCharge",0) as "expectedOtherCharge",coalesce(sum(e.amount) filter(where e."entryType"='OTHER_CHARGE'),0)::int as "ledgerOtherCharge",
   coalesce(l."depositRefunded",0) as "expectedDepositRefunded",coalesce(sum(e.amount) filter(where e."entryType"='DEPOSIT_REFUNDED'),0)::int as "ledgerDepositRefunded",
   coalesce(l."additionalPaymentReceived",0) as "expectedAdditionalPaymentReceived",coalesce(sum(e.amount) filter(where e."entryType"='ADDITIONAL_PAYMENT_RECEIVED'),0)::int as "ledgerAdditionalPaymentReceived",
   not(coalesce(l."depositReceived",0)=coalesce(sum(e.amount) filter(where e."entryType"='DEPOSIT_RECEIVED'),0) and (l.state<>'SETTLED' or (coalesce(l."finalRentalCharge",0)=coalesce(sum(e.amount) filter(where e."entryType"='FINAL_RENTAL_CHARGE'),0) and coalesce(l."damageCharge",0)=coalesce(sum(e.amount) filter(where e."entryType"='DAMAGE_CHARGE'),0) and coalesce(l."otherCharge",0)=coalesce(sum(e.amount) filter(where e."entryType"='OTHER_CHARGE'),0) and coalesce(l."depositRefunded",0)=coalesce(sum(e.amount) filter(where e."entryType"='DEPOSIT_REFUNDED'),0) and coalesce(l."additionalPaymentReceived",0)=coalesce(sum(e.amount) filter(where e."entryType"='ADDITIONAL_PAYMENT_RECEIVED'),0)))) as mismatch
  from public."RentalRequest" r join public."RentalLifecycle" l on l."rentalRequestId"=r.id left join public."RentalFinancialEntry" e on e."rentalRequestId"=r.id left join public."Branch" br on br.id=r."branchId" left join public."ProductRentalPolicy" pr on pr."productId"=r."productId"
  where p_rental_request_id is null or r.id=p_rental_request_id
  group by r.id,l."contractNumber",r."customerName",br.currency,pr.currency,l.state,l."depositReceived",l."finalRentalCharge",l."damageCharge",l."otherCharge",l."depositRefunded",l."additionalPaymentReceived"
 ) x; return v_result;
end $$;
revoke all on function public.admin_rental_financial_reconciliation(text,text) from public;
grant execute on function public.admin_rental_financial_reconciliation(text,text) to anon,authenticated;

create or replace function public.admin_rental_financial_alert_count(p_token text)
returns integer language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_count integer;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 select count(*)::int into v_count from jsonb_array_elements(public.admin_rental_financial_reconciliation(p_token,null)) j where coalesce((j->>'mismatch')::boolean,false)=true; return v_count;
end $$;
revoke all on function public.admin_rental_financial_alert_count(text) from public;
grant execute on function public.admin_rental_financial_alert_count(text) to anon,authenticated;
