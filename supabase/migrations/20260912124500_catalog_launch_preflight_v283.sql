create or replace function public.admin_catalog_launch_preflight_v283(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $$
declare
  v_admin public."AdminUser"%rowtype;
  v_branch public."Branch"%rowtype;
  v_policy public."BranchCommercePolicy"%rowtype;
  v_result jsonb;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then
    raise exception 'forbidden';
  end if;

  select *
    into v_branch
  from public."Branch"
  order by "isDefault" desc, "createdAt"
  limit 1;

  if not found then
    raise exception 'branch not found';
  end if;

  select *
    into v_policy
  from public."BranchCommercePolicy"
  where "branchId" = v_branch.id;

  with product_base as (
    select
      p.*,
      exists(
        select 1
        from public."ProductSourceEvidence" pse
        where pse."productId" = p.id
      ) as source_backed,
      exists(
        select 1
        from public."Media" m
        join public."ProductMediaEvidence" pme
          on pme."mediaId" = m.id
         and pme."productId" = p.id
         and pme."verificationStatus" = 'VERIFIED'
        where m."productId" = p.id
          and btrim(coalesce(m.url, '')) <> ''
      ) as has_verified_media,
      exists(
        select 1
        from public."ProductVariant" pv
        where pv."productId" = p.id
      ) as has_variants,
      exists(
        select 1
        from public."BranchProductPrice" bpp
        where bpp."branchId" = v_branch.id
          and bpp."productId" = p.id
          and bpp."isActive" = true
          and bpp.price > 0
      ) as has_current_branch_price,
      coalesce((
        select bpp.price
        from public."BranchProductPrice" bpp
        where bpp."branchId" = v_branch.id
          and bpp."productId" = p.id
          and bpp."isActive" = true
        limit 1
      ), p.price, 0) as effective_price,
      coalesce((
        select sum(greatest(wi."onHand" - wi.reserved - wi."rentalUnits", 0))
        from public."WarehouseInventory" wi
        join public."Warehouse" w
          on w.id = wi."warehouseId"
         and w."branchId" = v_branch.id
         and w."isActive" = true
        where wi."productId" = p.id
      ), 0)::int as available
    from public."Product" p
  ), scored as (
    select
      product_base.*,
      not (
        btrim(coalesce("nameFa", '')) = ''
        or btrim(coalesce("nameTr", '')) = ''
        or btrim(coalesce("nameEn", '')) = ''
        or btrim(coalesce("nameAr", '')) = ''
      ) as names_complete,
      not (
        btrim(coalesce("descriptionFa", '')) = ''
        or btrim(coalesce("descriptionTr", '')) = ''
        or btrim(coalesce("descriptionEn", '')) = ''
        or btrim(coalesce("descriptionAr", '')) = ''
      ) as descriptions_complete,
      array_remove(array[
        case when not source_backed then 'SOURCE_EVIDENCE_MISSING' end,
        case when
          btrim(coalesce("nameFa", '')) = ''
          or btrim(coalesce("nameTr", '')) = ''
          or btrim(coalesce("nameEn", '')) = ''
          or btrim(coalesce("nameAr", '')) = ''
          then 'TRANSLATION_MISSING' end,
        case when not has_verified_media then 'VERIFIED_IMAGE_MISSING' end,
        case when has_variants then 'VARIANT_REVIEW_REQUIRED' end,
        case when coalesce(v_branch."isPublished", false) = false then 'BRANCH_NOT_PUBLISHED' end,
        case when coalesce(v_policy."salesEnabled", false) = false then 'SALES_DISABLED' end,
        case when coalesce(v_policy."paymentGateway", 'DISABLED') <> 'ZARINPAL' then 'GATEWAY_NOT_ZARINPAL' end,
        case when coalesce(v_branch.currency, '') <> 'IRT' then 'CURRENCY_NOT_IRT' end,
        case when effective_price <= 0 then 'PRICE_MISSING' end,
        case when available <= 0 then 'STOCK_MISSING' end
      ], null) as blockers
    from product_base
  ), brand_rollup as (
    select
      coalesce(nullif(btrim(brand), ''), 'Unbranded') as brand,
      count(*)::int as products,
      count(*) filter (where source_backed)::int as source_backed,
      count(*) filter (where names_complete)::int as full_names,
      count(*) filter (where descriptions_complete)::int as full_descriptions,
      count(*) filter (where has_verified_media)::int as verified_media,
      count(*) filter (where has_current_branch_price)::int as current_branch_price,
      count(*) filter (where available > 0)::int as available_inventory,
      count(*) filter (where cardinality(blockers) = 0)::int as publish_ready
    from scored
    group by coalesce(nullif(btrim(brand), ''), 'Unbranded')
  )
  select jsonb_build_object(
    'version', 283,
    'generatedAt', now(),
    'branch', jsonb_build_object(
      'id', v_branch.id,
      'code', v_branch.code,
      'nameFa', v_branch."nameFa",
      'nameTr', v_branch."nameTr",
      'nameEn', v_branch."nameEn",
      'nameAr', v_branch."nameAr",
      'currency', v_branch.currency,
      'published', coalesce(v_branch."isPublished", false),
      'default', coalesce(v_branch."isDefault", false),
      'salesEnabled', coalesce(v_policy."salesEnabled", false),
      'paymentGateway', coalesce(v_policy."paymentGateway", 'DISABLED')
    ),
    'summary', jsonb_build_object(
      'stagingItems', (select count(*) from public."CatalogStagingItem"),
      'verifiedIdentities', (select count(*) from public."CatalogStagingItem" where "identityStatus" = 'VERIFIED'),
      'promotedStagingItems', (select count(*) from public."CatalogStagingItem" where "productId" is not null),
      'needsReviewStagingItems', (select count(*) from public."CatalogStagingItem" where status = 'NEEDS_REVIEW'),
      'technicalSourceBlockedStagingItems', (
        select count(*)
        from public."CatalogStagingItem"
        where coalesce(validation -> 'errors', '[]'::jsonb) ? 'technical_source_unverified'
      ),
      'products', count(*),
      'sourceBackedProducts', count(*) filter (where source_backed),
      'fourLanguageNameProducts', count(*) filter (where names_complete),
      'fourLanguageDescriptionProducts', count(*) filter (where descriptions_complete),
      'productsWithVerifiedMedia', count(*) filter (where has_verified_media),
      'productsWithCurrentBranchPrice', count(*) filter (where has_current_branch_price),
      'productsWithEffectivePrice', count(*) filter (where effective_price > 0),
      'productsWithAvailableInventory', count(*) filter (where available > 0),
      'productsWithVariants', count(*) filter (where has_variants),
      'publishReadyProducts', count(*) filter (where cardinality(blockers) = 0),
      'publishedProducts', count(*) filter (where "isPublished"),
      'activeBranchPriceRows', (
        select count(*)
        from public."BranchProductPrice"
        where "branchId" = v_branch.id and "isActive" = true and price > 0
      ),
      'warehouseInventoryRows', (
        select count(*)
        from public."WarehouseInventory" wi
        join public."Warehouse" w on w.id = wi."warehouseId"
        where w."branchId" = v_branch.id and w."isActive" = true
      )
    ),
    'blockers', jsonb_build_object(
      'sourceEvidenceMissing', count(*) filter (where not source_backed),
      'translationMissing', count(*) filter (where not names_complete),
      'verifiedMediaMissing', count(*) filter (where not has_verified_media),
      'variantReviewRequired', count(*) filter (where has_variants),
      'branchNotPublished', case when coalesce(v_branch."isPublished", false) then 0 else count(*) end,
      'salesDisabled', case when coalesce(v_policy."salesEnabled", false) then 0 else count(*) end,
      'gatewayNotZarinpal', case when coalesce(v_policy."paymentGateway", 'DISABLED') = 'ZARINPAL' then 0 else count(*) end,
      'currencyNotIrt', case when coalesce(v_branch.currency, '') = 'IRT' then 0 else count(*) end,
      'priceMissing', count(*) filter (where effective_price <= 0),
      'stockMissing', count(*) filter (where available <= 0),
      'descriptionWarning', count(*) filter (where not descriptions_complete)
    ),
    'byBrand', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'brand', brand,
            'products', products,
            'sourceBacked', source_backed,
            'fullNames', full_names,
            'fullDescriptions', full_descriptions,
            'verifiedMedia', verified_media,
            'currentBranchPrice', current_branch_price,
            'availableInventory', available_inventory,
            'publishReady', publish_ready
          )
          order by products desc, brand
        ),
        '[]'::jsonb
      )
      from brand_rollup
    ),
    'blockedStaging', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'siteSku', "siteSku",
            'sourceModel', "sourceModel",
            'status', status,
            'identityStatus', "identityStatus",
            'errors', coalesce(validation -> 'errors', '[]'::jsonb),
            'warnings', coalesce(validation -> 'warnings', '[]'::jsonb),
            'technicalSourceStatus', evidence ->> 'technicalSourceStatus'
          )
          order by "siteSku"
        ),
        '[]'::jsonb
      )
      from public."CatalogStagingItem"
      where "productId" is null
    )
  )
  into v_result
  from scored;

  return v_result;
end;
$$;

revoke all on function public.admin_catalog_launch_preflight_v283(text) from public, anon, authenticated;
grant execute on function public.admin_catalog_launch_preflight_v283(text) to service_role;
