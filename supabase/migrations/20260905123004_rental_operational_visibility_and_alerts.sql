create or replace function public.admin_rental_requests_v2(p_token text,p_search text default null,p_status text default null,p_lifecycle_state text default null,p_attention text default null)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 if p_lifecycle_state is not null and p_lifecycle_state<>'' and p_lifecycle_state not in ('APPROVED','ACTIVE','RETURNED','SETTLED','CANCELLED') then raise exception 'invalid lifecycle state'; end if;
 if p_attention is not null and p_attention<>'' and p_attention not in ('AWAITING_HANDOVER','OVERDUE','AWAITING_SETTLEMENT') then raise exception 'invalid attention filter'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x."createdAt" desc),'[]'::jsonb) into v_result from (
  select r.id,r."productId",r."customerName",r.phone,r.email,r."preferredStartDate",r."preferredEndDate",r."requestedQuantity",r."approvedQuantity",r."approvedStartDate",r."approvedEndDate",r."quotedAmount",r."quotedDeposit",r.address,r.notes,r.locale,r.status,r."adminNotes",r."createdAt",r."updatedAt",r."branchId",r."approvedWarehouseId",p.slug,p."nameFa",p."nameTr",p."nameEn",p."nameAr",b.name as "brandName",l.state as "lifecycleState",l."contractNumber",l."handoverAt",l."returnedAt",l."settledAt",(l.state='ACTIVE' and r."approvedEndDate" is not null and r."approvedEndDate"<current_date) as "isOverdue",(r.status='APPROVED' and coalesce(l.state,'APPROVED')='APPROVED') as "needsHandover",(l.state='RETURNED') as "needsSettlement"
  from public."RentalRequest" r join public."Product" p on p.id=r."productId" left join public."Brand" b on b.id=p."brandId" left join public."RentalLifecycle" l on l."rentalRequestId"=r.id
  where (p_status is null or p_status='' or r.status=p_status)
   and (p_lifecycle_state is null or p_lifecycle_state='' or coalesce(l.state,case when r.status='APPROVED' then 'APPROVED' end)=p_lifecycle_state)
   and (p_attention is null or p_attention='' or (p_attention='AWAITING_HANDOVER' and r.status='APPROVED' and coalesce(l.state,'APPROVED')='APPROVED') or (p_attention='OVERDUE' and l.state='ACTIVE' and r."approvedEndDate"<current_date) or (p_attention='AWAITING_SETTLEMENT' and l.state='RETURNED'))
   and (p_search is null or trim(p_search)='' or concat_ws(' ',r.id,r."customerName",r.phone,r.email,p."nameFa",p."nameTr",p."nameEn",p."nameAr",p.sku,b.name,l."contractNumber") ilike '%'||trim(p_search)||'%')
  limit 300
 ) x;
 return v_result;
end $$;

create or replace function public.admin_rental_operational_alerts(p_token text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden'; end if;
 select jsonb_build_object('awaitingHandover',count(*) filter(where r.status='APPROVED' and coalesce(l.state,'APPROVED')='APPROVED'),'active',count(*) filter(where l.state='ACTIVE'),'overdue',count(*) filter(where l.state='ACTIVE' and r."approvedEndDate" is not null and r."approvedEndDate"<current_date),'awaitingSettlement',count(*) filter(where l.state='RETURNED')) into v_result from public."RentalRequest" r left join public."RentalLifecycle" l on l."rentalRequestId"=r.id;
 return v_result;
end $$;
revoke all on function public.admin_rental_requests_v2(text,text,text,text,text) from public;
revoke all on function public.admin_rental_operational_alerts(text) from public;
grant execute on function public.admin_rental_requests_v2(text,text,text,text,text) to anon,authenticated;
grant execute on function public.admin_rental_operational_alerts(text) to anon,authenticated;
