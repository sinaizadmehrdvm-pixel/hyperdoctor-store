create or replace function public.admin_branch_commerce_bundle(p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_role text;
begin
  select public._admin_role(p_token) into v_role;
  if v_role not in ('SUPER_ADMIN','SALES') then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'branches',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'code',b.code,'nameFa',b."nameFa",'nameTr',b."nameTr",'nameEn',b."nameEn",'nameAr',b."nameAr",'countryCode',b."countryCode",'currency',b.currency,'salesEnabled',coalesce(cp."salesEnabled",false),'paymentGateway',coalesce(cp."paymentGateway",'DISABLED')) order by b."isDefault" desc,b."createdAt") from public."Branch" b left join public."BranchCommercePolicy" cp on cp."branchId"=b.id),'[]'::jsonb),
    'products',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'sku',p.sku,'nameFa',p."nameFa",'nameTr',p."nameTr",'nameEn',p."nameEn",'nameAr',p."nameAr",'basePrice',p.price,'baseCompareAtPrice',p."compareAtPrice") order by p.sku) from public."Product" p where p."isPublished"=true),'[]'::jsonb),
    'variants',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'productId',v."productId",'sku',v.sku,'name',v.name,'basePrice',v.price,'baseCompareAtPrice',v."compareAtPrice") order by v.sku) from public."ProductVariant" v join public."Product" p on p.id=v."productId" where v."isPublished"=true and p."isPublished"=true),'[]'::jsonb),
    'productPrices',coalesce((select jsonb_agg(to_jsonb(x)) from (select bp."branchId",bp."productId",bp.price,bp."compareAtPrice",bp."isActive" from public."BranchProductPrice" bp) x),'[]'::jsonb),
    'variantPrices',coalesce((select jsonb_agg(to_jsonb(x)) from (select vp."branchId",vp."variantId",vp."productId",vp.price,vp."compareAtPrice",vp."isActive" from public."BranchVariantPrice" vp) x),'[]'::jsonb)
  );
end $$;
revoke all on function public.admin_branch_commerce_bundle(text) from public;
grant execute on function public.admin_branch_commerce_bundle(text) to anon,authenticated;
