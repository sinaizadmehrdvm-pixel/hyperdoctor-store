create or replace function public.admin_update_rental_request_v2(
 p_token text,p_id text,p_status text,p_admin_notes text default null,p_approved_quantity integer default null,
 p_approved_start_date date default null,p_approved_end_date date default null,p_quoted_amount integer default null,p_quoted_deposit integer default null
) returns boolean language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype; v_product_id text; v_units integer; v_reserved integer:=0; v_qty integer; v_start date; v_end date;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SUPPORT'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden'; end if;
 if p_status not in ('NEW','CONTACTED','APPROVED','REJECTED','CLOSED') then raise exception 'invalid status'; end if;
 if p_admin_notes is not null and length(p_admin_notes)>2000 then raise exception 'notes too long'; end if;
 select r."productId",coalesce(p_approved_quantity,r."requestedQuantity"),coalesce(p_approved_start_date,r."preferredStartDate"),coalesce(p_approved_end_date,r."preferredEndDate")
 into v_product_id,v_qty,v_start,v_end from public."RentalRequest" r where r.id=p_id;
 if not found then raise exception 'rental request not found'; end if;
 if p_status='APPROVED' then
  if v_qty is null or v_qty<1 or v_start is null or v_end is null or v_end<v_start then raise exception 'approval requires valid quantity and dates'; end if;
  select "availableUnits" into v_units from public."ProductRentalPolicy" where "productId"=v_product_id and "isActive"=true;
  if not found then raise exception 'active rental policy required'; end if;
  select coalesce(sum(coalesce(r."approvedQuantity",r."requestedQuantity")),0)::int into v_reserved from public."RentalRequest" r
   where r."productId"=v_product_id and r.status='APPROVED' and r.id<>p_id
   and coalesce(r."approvedStartDate",r."preferredStartDate")<=v_end
   and coalesce(r."approvedEndDate",r."preferredEndDate")>=v_start;
  if v_reserved+v_qty>v_units then raise exception 'rental inventory unavailable for approval'; end if;
 end if;
 update public."RentalRequest" set status=p_status,"adminNotes"=nullif(trim(coalesce(p_admin_notes,'')),''),
  "approvedQuantity"=case when p_status='APPROVED' then v_qty else "approvedQuantity" end,
  "approvedStartDate"=case when p_status='APPROVED' then v_start else "approvedStartDate" end,
  "approvedEndDate"=case when p_status='APPROVED' then v_end else "approvedEndDate" end,
  "quotedAmount"=case when p_quoted_amount is null then "quotedAmount" else p_quoted_amount end,
  "quotedDeposit"=case when p_quoted_deposit is null then "quotedDeposit" else p_quoted_deposit end,
  "updatedAt"=now() where id=p_id;
 return true;
end $$;
revoke all on function public.admin_update_rental_request_v2(text,text,text,text,integer,date,date,integer,integer) from public;
grant execute on function public.admin_update_rental_request_v2(text,text,text,text,integer,date,date,integer,integer) to anon,authenticated;

create or replace function public.admin_rental_request_detail(p_token text,p_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SUPPORT'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden'; end if;
 select to_jsonb(x) into v_result from (
  select r.*,p.slug,p.sku,p."modelNumber",p."nameFa",p."nameTr",p."nameEn",p."nameAr",p."rentalEligible",b.name as "brandName",
   rp."availableUnits",rp."dailyRate",rp."weeklyRate",rp."monthlyRate",rp."depositAmount",rp.currency,rp."minDays",rp."maxDays",rp."isActive" as "policyActive"
  from public."RentalRequest" r
  join public."Product" p on p.id=r."productId"
  left join public."Brand" b on b.id=p."brandId"
  left join public."ProductRentalPolicy" rp on rp."productId"=p.id
  where r.id=p_id
 ) x;
 if v_result is null then raise exception 'rental request not found'; end if;
 return v_result;
end $$;
revoke all on function public.admin_rental_request_detail(text,text) from public;
grant execute on function public.admin_rental_request_detail(text,text) to anon,authenticated;

create or replace function public.admin_rental_requests(p_token text,p_search text default null,p_status text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SUPPORT'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x."createdAt" desc),'[]'::jsonb) into v_result from (
  select r.id,r."productId",r."customerName",r.phone,r.email,r."preferredStartDate",r."preferredEndDate",r."requestedQuantity",r."approvedQuantity",r."approvedStartDate",r."approvedEndDate",r."quotedAmount",r."quotedDeposit",r.address,r.notes,r.locale,r.status,r."adminNotes",r."createdAt",r."updatedAt",
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
grant execute on function public.admin_rental_requests(text,text,text) to anon,authenticated;
