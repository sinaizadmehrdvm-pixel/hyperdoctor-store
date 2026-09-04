create or replace function public.admin_rental_policies(p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token);
 if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x."nameEn",x."nameFa"),'[]'::jsonb) into v_result
 from (
  select p.id,p.sku,p."nameFa",p."nameTr",p."nameEn",p."nameAr",p."rentalEligible",b.name as "brandName",
    coalesce(rp."availableUnits",0) as "availableUnits",rp."dailyRate",rp."weeklyRate",rp."monthlyRate",rp."depositAmount",coalesce(rp.currency,'IRR') as currency,coalesce(rp."minDays",1) as "minDays",rp."maxDays",coalesce(rp."isActive",false) as "isActive"
  from public."Product" p
  left join public."Brand" b on b.id=p."brandId"
  left join public."ProductRentalPolicy" rp on rp."productId"=p.id
  where p."rentalEligible"=true
 ) x;
 return v_result;
end $$;
revoke all on function public.admin_rental_policies(text) from public;
grant execute on function public.admin_rental_policies(text) to anon,authenticated;
