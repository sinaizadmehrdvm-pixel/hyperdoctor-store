create or replace function public.admin_product_commerce_readiness(p_token text,p_id text)
returns jsonb
language plpgsql
security definer
set search_path='public'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_product public."Product"%rowtype;
  v_images integer:=0;
  v_variants integer:=0;
  v_catalog_ready boolean:=false;
  v_branches jsonb:='[]'::jsonb;
  v_any_sale_ready boolean:=false;
  v_any_checkout_ready boolean:=false;
  v_branch record;
  v_price integer;
  v_stock integer;
  v_ready_variants integer;
  v_reasons jsonb;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_product from public."Product" where id=p_id;
  if not found then raise exception 'product not found'; end if;
  select count(*)::integer into v_images from public."Media" where "productId"=p_id and btrim(coalesce(url,''))<>'';
  select count(*)::integer into v_variants from public."ProductVariant" where "productId"=p_id and "isPublished"=true;
  v_catalog_ready:=btrim(coalesce(v_product."nameFa",''))<>'' and btrim(coalesce(v_product."nameTr",''))<>'' and btrim(coalesce(v_product."nameEn",''))<>'' and btrim(coalesce(v_product."nameAr",''))<>'' and btrim(coalesce(v_product.sku,''))<>'' and btrim(coalesce(v_product.slug,''))<>'' and v_images>0;

  for v_branch in
    select b.id,b.code,b.currency,b."nameFa",b."nameTr",b."nameEn",b."nameAr",coalesce(cp."salesEnabled",false) as sales_enabled,coalesce(cp."paymentGateway",'DISABLED') as gateway
    from public."Branch" b left join public."BranchCommercePolicy" cp on cp."branchId"=b.id
    where b."isPublished"=true order by b."isDefault" desc,b."createdAt" asc
  loop
    v_price:=null;v_stock:=0;v_ready_variants:=0;v_reasons:='[]'::jsonb;
    if v_variants>0 then
      select count(*)::integer,
             coalesce(sum(x.available),0)::integer,
             min(x.effective_price) filter(where x.effective_price>0)
      into v_ready_variants,v_stock,v_price
      from (
        select pv.id,
          coalesce((select bp.price from public."BranchVariantPrice" bp where bp."branchId"=v_branch.id and bp."variantId"=pv.id and bp."isActive"=true),
                   (select pp.price from public."BranchProductPrice" pp where pp."branchId"=v_branch.id and pp."productId"=p_id and pp."isActive"=true),pv.price,v_product.price) as effective_price,
          coalesce((select sum(greatest(i."onHand"-i.reserved,0))::integer from public."Warehouse" w join public."WarehouseVariantInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch.id and w."isActive"=true and i."productId"=p_id and i."variantId"=pv.id),0) as available
        from public."ProductVariant" pv where pv."productId"=p_id and pv."isPublished"=true
      ) x where x.effective_price>0 and x.available>0;
    else
      select coalesce((select pp.price from public."BranchProductPrice" pp where pp."branchId"=v_branch.id and pp."productId"=p_id and pp."isActive"=true),v_product.price) into v_price;
      select coalesce(sum(greatest(i."onHand"-i.reserved,0)),0)::integer into v_stock from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch.id and w."isActive"=true and i."productId"=p_id;
    end if;
    if not v_product."isPublished" then v_reasons:=v_reasons||'"NOT_PUBLISHED"'::jsonb; end if;
    if v_images=0 then v_reasons:=v_reasons||'"MISSING_IMAGE"'::jsonb; end if;
    if not v_branch.sales_enabled then v_reasons:=v_reasons||'"SALES_DISABLED"'::jsonb; end if;
    if v_variants>0 then
      if v_ready_variants=0 then v_reasons:=v_reasons||'"NO_READY_VARIANT"'::jsonb; end if;
    else
      if coalesce(v_price,0)<=0 then v_reasons:=v_reasons||'"PRICE_UNAVAILABLE"'::jsonb; end if;
      if v_stock<=0 then v_reasons:=v_reasons||'"OUT_OF_STOCK"'::jsonb; end if;
    end if;
    v_any_sale_ready:=v_any_sale_ready or (v_product."isPublished" and v_images>0 and v_branch.sales_enabled and case when v_variants>0 then v_ready_variants>0 else coalesce(v_price,0)>0 and v_stock>0 end);
    v_any_checkout_ready:=v_any_checkout_ready or (v_product."isPublished" and v_images>0 and v_branch.sales_enabled and v_branch.gateway='ZARINPAL' and v_branch.currency='IRT' and case when v_variants>0 then v_ready_variants>0 else coalesce(v_price,0)>0 and v_stock>0 end);
    v_branches:=v_branches||jsonb_build_array(jsonb_build_object('branchId',v_branch.id,'branchCode',v_branch.code,'nameFa',v_branch."nameFa",'nameTr',v_branch."nameTr",'nameEn',v_branch."nameEn",'nameAr',v_branch."nameAr",'currency',v_branch.currency,'salesEnabled',v_branch.sales_enabled,'paymentGateway',v_branch.gateway,'price',v_price,'available',v_stock,'publishedVariants',v_variants,'readyVariants',v_ready_variants,'saleReady',v_product."isPublished" and v_images>0 and v_branch.sales_enabled and case when v_variants>0 then v_ready_variants>0 else coalesce(v_price,0)>0 and v_stock>0 end,'checkoutReady',v_product."isPublished" and v_images>0 and v_branch.sales_enabled and v_branch.gateway='ZARINPAL' and v_branch.currency='IRT' and case when v_variants>0 then v_ready_variants>0 else coalesce(v_price,0)>0 and v_stock>0 end,'reasons',v_reasons));
  end loop;
  return jsonb_build_object('productId',p_id,'isPublished',v_product."isPublished",'imageCount',v_images,'publishedVariants',v_variants,'catalogReady',v_catalog_ready,'saleReadyAnyBranch',v_any_sale_ready,'checkoutReadyAnyBranch',v_any_checkout_ready,'branches',v_branches);
end;$function$;

revoke all on function public.admin_product_commerce_readiness(text,text) from public,anon,authenticated;
grant execute on function public.admin_product_commerce_readiness(text,text) to service_role;

create or replace function public.public_validate_cart_v1(p_lines jsonb,p_branch_id text default null,p_locale text default 'fa')
returns jsonb
language plpgsql
security definer
set search_path='public'
as $function$
declare v_branch public."Branch"%rowtype; v_policy public."BranchCommercePolicy"%rowtype; v_line jsonb; v_out jsonb:='[]'::jsonb; v_type text; v_id text; v_variant_id text; v_key text; v_qty int; v_p public."Product"%rowtype; v_v public."ProductVariant"%rowtype; v_s public."Service"%rowtype; v_price int; v_stock int; v_min int; v_max int; v_name text; v_reason text; v_valid boolean; v_checkout boolean;
begin
 if p_locale not in ('fa','tr','en','ar') then p_locale:='fa'; end if;
 if p_lines is null or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)>100 then raise exception 'invalid lines'; end if;
 if nullif(btrim(coalesce(p_branch_id,'')),'') is not null then select * into v_branch from public."Branch" where id=p_branch_id and "isPublished"=true limit 1; else select * into v_branch from public."Branch" where "isPublished"=true order by "isDefault" desc,"createdAt" asc limit 1; end if;
 if not found then return jsonb_build_object('branchId',null,'checkoutEnabled',false,'lines','[]'::jsonb); end if;
 select * into v_policy from public."BranchCommercePolicy" where "branchId"=v_branch.id;
 v_checkout:=coalesce(v_policy."salesEnabled",false) and coalesce(v_policy."paymentGateway",'')='ZARINPAL' and v_branch.currency='IRT';
 for v_line in select value from jsonb_array_elements(p_lines) loop
   v_type:=coalesce(v_line->>'type',''); v_id:=nullif(btrim(coalesce(v_line->>'id','')),''); v_variant_id:=nullif(btrim(coalesce(v_line->>'variantId','')),''); v_key:=left(coalesce(v_line->>'key',''),420); v_reason:=null; v_valid:=false; v_price:=null; v_stock:=0; v_min:=1; v_max:=50; v_name:='';
   begin v_qty:=(v_line->>'quantity')::int; exception when others then v_qty:=0; end;
   if v_type='product' and v_id is not null then
     select * into v_p from public."Product" where id=v_id and "isPublished"=true;
     if not found then v_reason:='PRODUCT_UNAVAILABLE'; else
       v_min:=greatest(coalesce(v_p."minOrderQty",1),1); v_max:=least(coalesce(v_p."maxOrderQty",50),50);
       v_name:=case p_locale when 'fa' then v_p."nameFa" when 'tr' then coalesce(nullif(v_p."nameTr",''),v_p."nameEn") when 'ar' then coalesce(nullif(v_p."nameAr",''),v_p."nameEn") else v_p."nameEn" end;
       if not exists(select 1 from public."Media" m where m."productId"=v_p.id and btrim(coalesce(m.url,''))<>'') then v_reason:='IMAGE_UNAVAILABLE';
       elsif exists(select 1 from public."ProductVariant" x where x."productId"=v_p.id and x."isPublished"=true) then
         if v_variant_id is null then v_reason:='VARIANT_REQUIRED'; else
           select * into v_v from public."ProductVariant" where id=v_variant_id and "productId"=v_p.id and "isPublished"=true;
           if not found then v_reason:='VARIANT_UNAVAILABLE'; else
             select coalesce(sum(i."onHand"-i.reserved),0)::int into v_stock from public."Warehouse" w join public."WarehouseVariantInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch.id and w."isActive"=true and i."variantId"=v_v.id and i."productId"=v_p.id;
             select coalesce((select bp.price from public."BranchVariantPrice" bp where bp."branchId"=v_branch.id and bp."variantId"=v_v.id and bp."isActive"=true),(select bp.price from public."BranchProductPrice" bp where bp."branchId"=v_branch.id and bp."productId"=v_p.id and bp."isActive"=true),v_v.price,v_p.price) into v_price;
             v_name:=v_name||' — '||v_v.name;
           end if;
         end if;
       else
         if v_variant_id is not null then v_reason:='VARIANT_UNAVAILABLE'; else
           select coalesce(sum(i."onHand"-i.reserved),0)::int into v_stock from public."Warehouse" w join public."WarehouseInventory" i on i."warehouseId"=w.id where w."branchId"=v_branch.id and w."isActive"=true and i."productId"=v_p.id;
           select coalesce((select bp.price from public."BranchProductPrice" bp where bp."branchId"=v_branch.id and bp."productId"=v_p.id and bp."isActive"=true),v_p.price) into v_price;
         end if;
       end if;
       if v_reason is null then
         if not coalesce(v_policy."salesEnabled",false) then v_reason:='SALES_DISABLED'; elsif v_price is null or v_price<=0 then v_reason:='PRICE_UNAVAILABLE'; elsif v_qty<v_min or v_qty>v_max then v_reason:='QUANTITY_INVALID'; elsif v_stock<v_qty then v_reason:='INSUFFICIENT_STOCK'; else v_valid:=true; end if;
       end if;
     end if;
   elsif v_type='service' and v_id is not null then
     select * into v_s from public."Service" where id=v_id and "isPublished"=true;
     if not found then v_reason:='SERVICE_UNAVAILABLE'; elsif v_s.price is null or v_s.price<=0 then v_reason:='BOOKING_REQUIRED'; elsif v_qty<>1 then v_reason:='QUANTITY_INVALID'; elsif not coalesce(v_policy."salesEnabled",false) then v_reason:='SALES_DISABLED'; else v_valid:=true;v_price:=v_s.price;v_stock:=1;v_min:=1;v_max:=1;v_name:=case p_locale when 'fa' then v_s."nameFa" when 'tr' then coalesce(nullif(v_s."nameTr",''),v_s."nameEn") when 'ar' then coalesce(nullif(v_s."nameAr",''),v_s."nameEn") else v_s."nameEn" end; end if;
   else v_reason:='INVALID_LINE'; end if;
   v_out:=v_out||jsonb_build_array(jsonb_build_object('key',v_key,'type',v_type,'id',v_id,'variantId',v_variant_id,'valid',v_valid,'reason',v_reason,'price',v_price,'available',greatest(v_stock,0),'minQuantity',v_min,'maxQuantity',v_max,'quantity',v_qty,'name',v_name));
 end loop;
 return jsonb_build_object('branchId',v_branch.id,'branchCode',v_branch.code,'currency',v_branch.currency,'countryCode',v_branch."countryCode",'salesEnabled',coalesce(v_policy."salesEnabled",false),'paymentGateway',coalesce(v_policy."paymentGateway",'DISABLED'),'checkoutEnabled',v_checkout,'lines',v_out);
end $function$;

create or replace function public.create_guest_order_v4(p_request_token uuid,p_customer_name text,p_phone text,p_email text,p_address text,p_province text,p_city text,p_country text,p_postal_code text,p_notes text,p_locale text,p_lines jsonb,p_branch_id text default null)
returns jsonb
language plpgsql
security definer
set search_path='public'
as $function$
declare v_result jsonb;v_order_id text;v_branch_id text;v_sales_enabled boolean;v_gateway text;v_currency text;v_subtotal bigint;v_preflight jsonb;
begin
  v_branch_id:=nullif(btrim(coalesce(p_branch_id,'')),'');
  if v_branch_id is null then select id into v_branch_id from public."Branch" where "isPublished"=true order by "isDefault" desc,"createdAt" asc limit 1; end if;
  if v_branch_id is null then raise exception 'branch unavailable'; end if;
  select cp."salesEnabled",cp."paymentGateway",b.currency into v_sales_enabled,v_gateway,v_currency from public."BranchCommercePolicy" cp join public."Branch" b on b.id=cp."branchId" where cp."branchId"=v_branch_id and b."isPublished"=true;
  if not found or not coalesce(v_sales_enabled,false) then raise exception 'branch checkout disabled'; end if;
  if v_gateway <> 'ZARINPAL' then raise exception 'payment gateway unavailable for branch'; end if;
  if v_currency <> 'IRT' then raise exception 'payment currency unavailable for branch'; end if;
  v_preflight:=public.public_validate_cart_v1(p_lines,v_branch_id,p_locale);
  if not coalesce((v_preflight->>'checkoutEnabled')::boolean,false) then raise exception 'checkout unavailable'; end if;
  if exists(select 1 from jsonb_array_elements(coalesce(v_preflight->'lines','[]'::jsonb)) x where not coalesce((x.value->>'valid')::boolean,false)) then raise exception 'cart validation failed'; end if;
  v_result:=public.create_guest_order_v3(p_request_token,p_customer_name,p_phone,p_email,p_address,p_province,p_city,p_country,p_postal_code,p_notes,p_locale,p_lines,v_branch_id);
  v_order_id:=v_result->>'orderId';
  if v_order_id is null then raise exception 'order unavailable'; end if;
  update public."OrderItem" oi set "priceSnapshot"=coalesce(case when oi."variantId" is not null then (select vp.price from public."BranchVariantPrice" vp where vp."branchId"=v_branch_id and vp."variantId"=oi."variantId" and vp."isActive"=true) end,(select bp.price from public."BranchProductPrice" bp where bp."branchId"=v_branch_id and bp."productId"=oi."productId" and bp."isActive"=true),oi."priceSnapshot") where oi."orderId"=v_order_id and oi."productId" is not null;
  select coalesce(sum(oi."priceSnapshot"::bigint*oi.quantity::bigint),0) into v_subtotal from public."OrderItem" oi where oi."orderId"=v_order_id;
  if v_subtotal<=0 or v_subtotal>2147483647 then raise exception 'invalid order total'; end if;
  update public."Order" set currency=v_currency,subtotal=v_subtotal::int,total=(v_subtotal-"discountAmount"+"shippingFee")::int,gateway='ZARINPAL'::public."PaymentGateway","updatedAt"=now() where id=v_order_id;
  select jsonb_build_object('orderId',o.id,'orderNumber',o."orderNumber",'total',o.total,'checkoutToken',o."checkoutToken",'resultToken',o."resultToken",'status',o.status::text,'reservationExpiresAt',o."reservationExpiresAt",'branchId',o."branchId",'currency',o.currency,'gateway',o.gateway::text) into v_result from public."Order" o where o.id=v_order_id;
  return v_result;
end $function$;
