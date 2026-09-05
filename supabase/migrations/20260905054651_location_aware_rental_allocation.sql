alter table public."RentalRequest" add column if not exists "branchId" text null references public."Branch"(id) on delete set null;
alter table public."RentalRequest" add column if not exists "approvedWarehouseId" text null references public."Warehouse"(id) on delete set null;
create index if not exists "RentalRequest_branchId_idx" on public."RentalRequest"("branchId");
create index if not exists "RentalRequest_approvedWarehouseId_idx" on public."RentalRequest"("approvedWarehouseId");

create or replace function public.public_rental_catalog_v2(p_product_id text default null,p_branch_id text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb;v_branch_id text;
begin
 v_branch_id:=nullif(btrim(coalesce(p_branch_id,'')),'');
 if v_branch_id is null then select b.id into v_branch_id from public."Branch" b where b."isPublished"=true and exists(select 1 from public."Warehouse" w where w."branchId"=b.id and w."isActive"=true) order by b."isDefault" desc,b."createdAt" asc limit 1;end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x."nameEn",x."nameFa"),'[]'::jsonb) into v_result from (
  select p.id,p.slug,p."nameFa",p."nameTr",p."nameEn",p."nameAr",p."modelNumber",p."brandId",b.name as "brandName",
   case when v_branch_id is not null and exists(select 1 from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch_id and w."isActive"=true and i."productId"=p.id)
    then (select coalesce(sum(i."rentalUnits"),0)::int from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch_id and w."isActive"=true and i."productId"=p.id)
    else rp."availableUnits" end as "availableUnits",rp."dailyRate",rp."weeklyRate",rp."monthlyRate",rp."depositAmount",rp.currency,rp."minDays",rp."maxDays",v_branch_id as "branchId"
  from public."Product" p join public."ProductRentalPolicy" rp on rp."productId"=p.id and rp."isActive"=true left join public."Brand" b on b.id=p."brandId"
  where p."isPublished"=true and p."rentalEligible"=true and (p_product_id is null or p.id=p_product_id)
 )x where x."availableUnits">0;return v_result;
end $$;
revoke all on function public.public_rental_catalog_v2(text,text) from public;grant execute on function public.public_rental_catalog_v2(text,text) to anon,authenticated;

create or replace function public.create_rental_request_v2(p_request_token uuid,p_product_id text,p_customer_name text,p_phone text,p_email text default null,p_preferred_start_date date default null,p_preferred_end_date date default null,p_address text default null,p_notes text default null,p_locale text default 'fa',p_requested_quantity integer default 1,p_branch_id text default null)
returns text language plpgsql security definer set search_path=public as $$
declare v_id text;v_branch_id text;v_units int;v_reserved int:=0;
begin
 v_branch_id:=nullif(btrim(coalesce(p_branch_id,'')),'');if v_branch_id is null then select b.id into v_branch_id from public."Branch" b where b."isPublished"=true and exists(select 1 from public."Warehouse" w where w."branchId"=b.id and w."isActive"=true) order by b."isDefault" desc,b."createdAt" asc limit 1;end if;
 if v_branch_id is null then return public.create_rental_request(p_request_token,p_product_id,p_customer_name,p_phone,p_email,p_preferred_start_date,p_preferred_end_date,p_address,p_notes,p_locale,p_requested_quantity);end if;
 if not exists(select 1 from public."Branch" where id=v_branch_id and "isPublished"=true) then raise exception 'branch unavailable';end if;
 select case when exists(select 1 from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch_id and w."isActive"=true and i."productId"=p_product_id)
  then (select coalesce(sum(i."rentalUnits"),0)::int from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch_id and w."isActive"=true and i."productId"=p_product_id)
  else rp."availableUnits" end into v_units from public."Product" p join public."ProductRentalPolicy" rp on rp."productId"=p.id and rp."isActive"=true where p.id=p_product_id and p."isPublished"=true and p."rentalEligible"=true;
 if not found or v_units<1 then raise exception 'product is not rental eligible at branch';end if;if p_requested_quantity>v_units then raise exception 'requested quantity exceeds branch rental inventory';end if;
 if p_preferred_start_date is not null and p_preferred_end_date is not null then select coalesce(sum(coalesce(r."approvedQuantity",r."requestedQuantity")),0)::int into v_reserved from public."RentalRequest" r where r."productId"=p_product_id and r.status='APPROVED' and (r."branchId"=v_branch_id or r."branchId" is null) and coalesce(r."approvedStartDate",r."preferredStartDate")<=p_preferred_end_date and coalesce(r."approvedEndDate",r."preferredEndDate")>=p_preferred_start_date;if v_reserved+p_requested_quantity>v_units then raise exception 'rental inventory unavailable for selected branch dates';end if;end if;
 v_id:=public.create_rental_request(p_request_token,p_product_id,p_customer_name,p_phone,p_email,p_preferred_start_date,p_preferred_end_date,p_address,p_notes,p_locale,p_requested_quantity);update public."RentalRequest" set "branchId"=coalesce("branchId",v_branch_id),"updatedAt"=now() where id=v_id and ("branchId" is null or "branchId"=v_branch_id);if not found then raise exception 'rental request branch mismatch';end if;return v_id;
end $$;
revoke all on function public.create_rental_request_v2(uuid,text,text,text,text,date,date,text,text,text,integer,text) from public;grant execute on function public.create_rental_request_v2(uuid,text,text,text,text,date,date,text,text,text,integer,text) to anon,authenticated;

create or replace function public.admin_update_rental_request_v3(p_token text,p_id text,p_status text,p_admin_notes text default null,p_approved_quantity integer default null,p_approved_start_date date default null,p_approved_end_date date default null,p_quoted_amount integer default null,p_quoted_deposit integer default null,p_approved_warehouse_id text default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype;v_product_id text;v_branch_id text;v_wh text;v_qty int;v_start date;v_end date;v_capacity int;v_reserved int;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SUPPORT'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden';end if;
 select r."productId",r."branchId",coalesce(p_approved_quantity,r."requestedQuantity"),coalesce(p_approved_start_date,r."preferredStartDate"),coalesce(p_approved_end_date,r."preferredEndDate") into v_product_id,v_branch_id,v_qty,v_start,v_end from public."RentalRequest" r where r.id=p_id;if not found then raise exception 'rental request not found';end if;
 if v_branch_id is null or p_status<>'APPROVED' then return public.admin_update_rental_request_v2(p_token,p_id,p_status,p_admin_notes,p_approved_quantity,p_approved_start_date,p_approved_end_date,p_quoted_amount,p_quoted_deposit);end if;
 if v_qty is null or v_qty<1 or v_start is null or v_end is null or v_end<v_start then raise exception 'approval requires valid quantity and dates';end if;
 v_wh:=nullif(btrim(coalesce(p_approved_warehouse_id,'')),'');if v_wh is not null and not exists(select 1 from public."Warehouse" where id=v_wh and "branchId"=v_branch_id and "isActive"=true) then raise exception 'warehouse unavailable';end if;
 if v_wh is null then for v_wh,v_capacity in select w.id,i."rentalUnits" from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id and i."productId"=v_product_id where w."branchId"=v_branch_id and w."isActive"=true order by i."rentalUnits" desc,w.code loop select coalesce(sum(coalesce(r."approvedQuantity",r."requestedQuantity")),0)::int into v_reserved from public."RentalRequest" r where r."approvedWarehouseId"=v_wh and r.status='APPROVED' and r.id<>p_id and coalesce(r."approvedStartDate",r."preferredStartDate")<=v_end and coalesce(r."approvedEndDate",r."preferredEndDate")>=v_start;if v_capacity-v_reserved>=v_qty then exit;end if;v_wh:=null;end loop;else select i."rentalUnits" into v_capacity from public."WarehouseInventory" i where i."warehouseId"=v_wh and i."productId"=v_product_id;if not found then raise exception 'warehouse rental inventory unavailable';end if;select coalesce(sum(coalesce(r."approvedQuantity",r."requestedQuantity")),0)::int into v_reserved from public."RentalRequest" r where r."approvedWarehouseId"=v_wh and r.status='APPROVED' and r.id<>p_id and coalesce(r."approvedStartDate",r."preferredStartDate")<=v_end and coalesce(r."approvedEndDate",r."preferredEndDate")>=v_start;if v_capacity-v_reserved<v_qty then raise exception 'warehouse rental inventory unavailable';end if;end if;
 if v_wh is null then raise exception 'warehouse rental inventory unavailable';end if;perform public.admin_update_rental_request_v2(p_token,p_id,p_status,p_admin_notes,p_approved_quantity,p_approved_start_date,p_approved_end_date,p_quoted_amount,p_quoted_deposit);update public."RentalRequest" set "approvedWarehouseId"=v_wh,"updatedAt"=now() where id=p_id;return true;
end $$;
revoke all on function public.admin_update_rental_request_v3(text,text,text,text,integer,date,date,integer,integer,text) from public;grant execute on function public.admin_update_rental_request_v3(text,text,text,text,integer,date,date,integer,integer,text) to anon,authenticated;
