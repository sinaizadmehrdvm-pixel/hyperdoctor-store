-- Version 263: production launch operations summary
create or replace function public.admin_launch_operations_summary(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_result jsonb;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'catalogSources', (select count(*) from public."CatalogSource"),
    'stagingBatches', (select count(*) from public."CatalogStagingBatch" where status <> 'ARCHIVED'),
    'stagingItems', (select count(*) from public."CatalogStagingItem"),
    'stagingApproved', (select count(*) from public."CatalogStagingItem" where status = 'APPROVED'),
    'stagingPromoted', (select count(*) from public."CatalogStagingItem" where status = 'PROMOTED'),
    'products', (select count(*) from public."Product"),
    'draftProducts', (select count(*) from public."Product" where "isPublished" = false),
    'publishedProducts', (select count(*) from public."Product" where "isPublished" = true),
    'sourceBackedProducts', (select count(distinct "productId") from public."ProductSourceEvidence"),
    'productsWithVerifiedMedia', (select count(distinct "productId") from public."ProductMediaEvidence" where "verificationStatus" = 'VERIFIED'),
    'verifiedMediaEvidence', (select count(*) from public."ProductMediaEvidence" where "verificationStatus" = 'VERIFIED'),
    'branchPrices', (select count(*) from public."BranchProductPrice" where "isActive" = true and price > 0),
    'warehouseInventoryRows', (select count(*) from public."WarehouseInventory" where "onHand" > 0),
    'commerceSources', (select count(*) from public."CommerceSource"),
    'commerceEvidence', (select count(*) from public."CommerceDataEvidence"),
    'orders', (select count(*) from public."Order"),
    'branches', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id,
        'code', b.code,
        'nameFa', b."nameFa",
        'nameTr', b."nameTr",
        'nameEn', b."nameEn",
        'nameAr', b."nameAr",
        'currency', b.currency,
        'published', b."isPublished",
        'default', b."isDefault",
        'salesEnabled', coalesce(cp."salesEnabled", false),
        'paymentGateway', coalesce(cp."paymentGateway", 'DISABLED')
      ) order by b."isDefault" desc, b.code), '[]'::jsonb)
      from public."Branch" b
      left join public."BranchCommercePolicy" cp on cp."branchId" = b.id
    )
  ) into v_result;

  return v_result;
end;
$function$;

revoke all on function public.admin_launch_operations_summary(text) from public, anon, authenticated;
grant execute on function public.admin_launch_operations_summary(text) to service_role;
