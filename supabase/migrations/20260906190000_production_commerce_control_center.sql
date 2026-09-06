-- Version 255: unified, branch-aware production commerce control center.
create or replace function public.admin_commerce_control_center(
  p_token text,
  p_branch_id text default null,
  p_search text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_branch_id text;
  v_branch public."Branch"%rowtype;
  v_policy public."BranchCommercePolicy"%rowtype;
  v_products jsonb;
  v_warehouses jsonb;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'SALES'::"AdminRole") then raise exception 'forbidden'; end if;

  v_branch_id := nullif(btrim(coalesce(p_branch_id,'')),'');
  if v_branch_id is null then
    select id into v_branch_id from public."Branch" where "isPublished"=true order by "isDefault" desc,"createdAt" asc limit 1;
  end if;
  if v_branch_id is null then
    select id into v_branch_id from public."Branch" order by "isDefault" desc,"createdAt" asc limit 1;
  end if;
  if v_branch_id is null then
    return jsonb_build_object('branch',null,'branches','[]'::jsonb,'warehouses','[]'::jsonb,'products','[]'::jsonb,'summary',jsonb_build_object('total',0,'ready',0,'blocked',0));
  end if;

  select * into v_branch from public."Branch" where id=v_branch_id;
  if not found then raise exception 'branch not found'; end if;
  select * into v_policy from public."BranchCommercePolicy" where "branchId"=v_branch_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',w.id,'code',w.code,'nameFa',w."nameFa",'nameTr',w."nameTr",'nameEn',w."nameEn",'nameAr',w."nameAr",'isActive',w."isActive"
  ) order by w."isActive" desc,w.code),'[]'::jsonb)
  into v_warehouses from public."Warehouse" w where w."branchId"=v_branch_id;

  with product_base as (
    select p.*,
      exists(select 1 from public."Media" m where m."productId"=p.id and nullif(btrim(m.url),'') is not null) as has_image,
      exists(select 1 from public."ProductVariant" pv where pv."productId"=p.id and pv."isPublished"=true) as has_variants,
      coalesce((select bp.price from public."BranchProductPrice" bp where bp."branchId"=v_branch_id and bp."productId"=p.id and bp."isActive"=true),p.price) as effective_price,
      (select bp."compareAtPrice" from public."BranchProductPrice" bp where bp."branchId"=v_branch_id and bp."productId"=p.id and bp."isActive"=true) as branch_compare_at,
      coalesce((select sum(greatest(i."onHand"-i.reserved,0))::int from public."WarehouseInventory" i join public."Warehouse" w on w.id=i."warehouseId" where w."branchId"=v_branch_id and w."isActive"=true and i."productId"=p.id),0) as product_available,
      exists(
        select 1 from public."ProductVariant" pv
        where pv."productId"=p.id and pv."isPublished"=true
          and coalesce((select bvp.price from public."BranchVariantPrice" bvp where bvp."branchId"=v_branch_id and bvp."variantId"=pv.id and bvp."isActive"=true),(select bp.price from public."BranchProductPrice" bp where bp."branchId"=v_branch_id and bp."productId"=p.id and bp."isActive"=true),pv.price,p.price)>0
          and coalesce((select sum(greatest(i."onHand"-i.reserved,0))::int from public."WarehouseVariantInventory" i join public."Warehouse" w on w.id=i."warehouseId" where w."branchId"=v_branch_id and w."isActive"=true and i."variantId"=pv.id),0)>0
      ) as has_ready_variant
    from public."Product" p
    where (p_search is null or btrim(p_search)='' or concat_ws(' ',p.sku,p."nameFa",p."nameTr",p."nameEn",p."nameAr",p.brand,p."modelNumber") ilike '%'||btrim(p_search)||'%')
    order by p."isPublished" desc,p."nameEn",p.sku
    limit 500
  ), rows as (
    select pb.*,
      (pb."isPublished"=true and pb.has_image=true
       and coalesce(v_policy."salesEnabled",false)=true
       and coalesce(v_policy."paymentGateway",'DISABLED')='ZARINPAL'
       and v_branch.currency='IRT'
       and case when pb.has_variants then pb.has_ready_variant else pb.effective_price>0 and pb.product_available>0 end) as ready,
      array_remove(array[
        case when pb."isPublished"<>true then 'NOT_PUBLISHED' end,
        case when pb.has_image<>true then 'IMAGE_MISSING' end,
        case when coalesce(v_policy."salesEnabled",false)<>true then 'SALES_DISABLED' end,
        case when coalesce(v_policy."paymentGateway",'DISABLED')<>'ZARINPAL' then 'GATEWAY_NOT_ZARINPAL' end,
        case when v_branch.currency<>'IRT' then 'CURRENCY_NOT_IRT' end,
        case when pb.has_variants and not pb.has_ready_variant then 'NO_SELLABLE_VARIANT' end,
        case when not pb.has_variants and coalesce(pb.effective_price,0)<=0 then 'PRICE_MISSING' end,
        case when not pb.has_variants and pb.product_available<=0 then 'STOCK_MISSING' end
      ],null) as blockers
    from product_base pb
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'sku',r.sku,'slug',r.slug,'nameFa',r."nameFa",'nameTr',r."nameTr",'nameEn',r."nameEn",'nameAr',r."nameAr",
    'published',r."isPublished",'hasImage',r.has_image,'hasVariants',r.has_variants,'effectivePrice',r.effective_price,
    'compareAtPrice',coalesce(r.branch_compare_at,r."compareAtPrice"),'available',r.product_available,'ready',r.ready,'blockers',to_jsonb(r.blockers)
  ) order by r.ready desc,r."isPublished" desc,r."nameEn",r.sku),'[]'::jsonb)
  into v_products from rows r;

  return jsonb_build_object(
    'branch',jsonb_build_object('id',v_branch.id,'code',v_branch.code,'nameFa',v_branch."nameFa",'nameTr',v_branch."nameTr",'nameEn',v_branch."nameEn",'nameAr',v_branch."nameAr",'currency',v_branch.currency,'countryCode',v_branch."countryCode",'isPublished',v_branch."isPublished",'salesEnabled',coalesce(v_policy."salesEnabled",false),'paymentGateway',coalesce(v_policy."paymentGateway",'DISABLED')),
    'branches',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'code',b.code,'nameFa',b."nameFa",'nameTr',b."nameTr",'nameEn',b."nameEn",'nameAr',b."nameAr",'currency',b.currency,'isPublished',b."isPublished") order by b."isDefault" desc,b."createdAt") from public."Branch" b),'[]'::jsonb),
    'warehouses',v_warehouses,
    'products',v_products,
    'summary',jsonb_build_object('total',jsonb_array_length(v_products),'ready',(select count(*) from jsonb_array_elements(v_products) x where coalesce((x->>'ready')::boolean,false)),'blocked',(select count(*) from jsonb_array_elements(v_products) x where not coalesce((x->>'ready')::boolean,false)))
  );
end;
$function$;

revoke all on function public.admin_commerce_control_center(text,text,text) from public, anon, authenticated;
grant execute on function public.admin_commerce_control_center(text,text,text) to service_role;
