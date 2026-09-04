do $$
declare v_name text;
begin
  select conname into v_name
  from pg_constraint
  where conrelid='public."ProductRelation"'::regclass
    and contype='c'
    and pg_get_constraintdef(oid) ilike '%relationType%'
  limit 1;
  if v_name is not null then
    execute format('alter table public."ProductRelation" drop constraint %I',v_name);
  end if;
end $$;

alter table public."ProductRelation"
  add constraint "ProductRelation_relationType_check_v2"
  check ("relationType" in ('ALTERNATIVE','UPGRADE','ACCESSORY','COMPATIBLE_WITH'));

create or replace function public.admin_set_product_relations_and_flags(
  p_token text,
  p_product_id text,
  p_rental_eligible boolean,
  p_professional_use boolean,
  p_home_use boolean,
  p_relations jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_admin public."AdminUser"%rowtype;
  v_item jsonb;
  v_related text;
  v_type text;
  v_sort int;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  if not exists(select 1 from public."Product" where id=p_product_id) then raise exception 'product_not_found'; end if;

  update public."Product"
  set "rentalEligible"=coalesce(p_rental_eligible,false),
      "professionalUse"=coalesce(p_professional_use,false),
      "homeUse"=coalesce(p_home_use,false),
      "updatedAt"=now()
  where id=p_product_id;

  delete from public."ProductRelation" where "productId"=p_product_id;

  for v_item in select value from jsonb_array_elements(coalesce(p_relations,'[]'::jsonb)) loop
    v_related:=nullif(trim(v_item->>'relatedProductId'),'');
    v_type:=upper(nullif(trim(v_item->>'relationType'),''));
    v_sort:=coalesce((v_item->>'sortOrder')::int,0);
    if v_related is null or v_related=p_product_id or v_type not in ('ALTERNATIVE','UPGRADE','ACCESSORY','COMPATIBLE_WITH') then continue; end if;
    if not exists(select 1 from public."Product" where id=v_related) then continue; end if;
    insert into public."ProductRelation"("productId","relatedProductId","relationType","sortOrder")
      values(p_product_id,v_related,v_type,v_sort)
    on conflict ("productId","relatedProductId","relationType") do update set "sortOrder"=excluded."sortOrder";
  end loop;

  return jsonb_build_object('ok',true);
end $$;

revoke all on function public.admin_set_product_relations_and_flags(text,text,boolean,boolean,boolean,jsonb) from public;
grant execute on function public.admin_set_product_relations_and_flags(text,text,boolean,boolean,boolean,jsonb) to anon, authenticated;

create or replace function public.admin_rental_request_detail(p_token text,p_id text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'SUPPORT'::"AdminRole",'SALES'::"AdminRole") then raise exception 'forbidden'; end if;
  select to_jsonb(x) into v_result
  from (
    select r.id,r."productId",r."customerName",r.phone,r.email,r."preferredStartDate",r."preferredEndDate",r.address,r.notes,r.locale,r.status,r."adminNotes",r."createdAt",r."updatedAt",
      p.slug,p.sku,p."modelNumber",p."nameFa",p."nameTr",p."nameEn",p."nameAr",p."rentalEligible",b.name as "brandName"
    from public."RentalRequest" r
    join public."Product" p on p.id=r."productId"
    left join public."Brand" b on b.id=p."brandId"
    where r.id=p_id
  ) x;
  if v_result is null then raise exception 'rental request not found'; end if;
  return v_result;
end $$;

revoke all on function public.admin_rental_request_detail(text,text) from public;
grant execute on function public.admin_rental_request_detail(text,text) to anon, authenticated;
