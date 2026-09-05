create or replace function public.admin_location_allocations(p_token text,p_search text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype;v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token);if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SALES'::public."AdminRole") then raise exception 'forbidden';end if;
 select jsonb_build_object(
  'orders',coalesce((select jsonb_agg(to_jsonb(x) order by x."createdAt" desc) from (
   select o.id as "orderId",o."orderNumber",o.status::text,o."createdAt",o."customerName",o."branchId",b.code as "branchCode",b."nameFa" as "branchNameFa",b."nameTr" as "branchNameTr",b."nameEn" as "branchNameEn",b."nameAr" as "branchNameAr",
    i.id as "itemId",i."productId",i."nameSnapshot",i.quantity,i."warehouseId",w.code as "warehouseCode",w."nameFa" as "warehouseNameFa",w."nameTr" as "warehouseNameTr",w."nameEn" as "warehouseNameEn",w."nameAr" as "warehouseNameAr"
   from public."Order" o join public."OrderItem" i on i."orderId"=o.id left join public."Branch" b on b.id=o."branchId" left join public."Warehouse" w on w.id=i."warehouseId"
   where i."productId" is not null and (p_search is null or trim(p_search)='' or concat_ws(' ',o."orderNumber",o."customerName",i."nameSnapshot",b.code,w.code) ilike '%'||trim(p_search)||'%')
   order by o."createdAt" desc limit 300
  )x),'[]'::jsonb),
  'rentals',coalesce((select jsonb_agg(to_jsonb(y) order by y."createdAt" desc) from (
   select r.id as "rentalId",r.status,r."createdAt",r."customerName",r."productId",p.sku,p."nameFa",p."nameTr",p."nameEn",p."nameAr",r."requestedQuantity",r."approvedQuantity",r."approvedStartDate",r."approvedEndDate",r."branchId",b.code as "branchCode",b."nameFa" as "branchNameFa",b."nameTr" as "branchNameTr",b."nameEn" as "branchNameEn",b."nameAr" as "branchNameAr",r."approvedWarehouseId" as "warehouseId",w.code as "warehouseCode",w."nameFa" as "warehouseNameFa",w."nameTr" as "warehouseNameTr",w."nameEn" as "warehouseNameEn",w."nameAr" as "warehouseNameAr"
   from public."RentalRequest" r join public."Product" p on p.id=r."productId" left join public."Branch" b on b.id=r."branchId" left join public."Warehouse" w on w.id=r."approvedWarehouseId"
   where (p_search is null or trim(p_search)='' or concat_ws(' ',r.id,r."customerName",p.sku,p."nameFa",p."nameEn",b.code,w.code) ilike '%'||trim(p_search)||'%')
   order by r."createdAt" desc limit 300
  )y),'[]'::jsonb)
 ) into v_result;return v_result;
end $$;
revoke all on function public.admin_location_allocations(text,text) from public;
grant execute on function public.admin_location_allocations(text,text) to anon,authenticated;
