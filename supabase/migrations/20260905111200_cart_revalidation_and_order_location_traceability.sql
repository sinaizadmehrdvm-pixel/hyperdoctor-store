create or replace function public.public_validate_cart_v1(p_lines jsonb,p_branch_id text default null,p_locale text default 'fa') returns jsonb language plpgsql security definer set search_path='public' as $$
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
       if exists(select 1 from public."ProductVariant" x where x."productId"=v_p.id and x."isPublished"=true) then
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
end $$;
revoke execute on function public.public_validate_cart_v1(jsonb,text,text) from public;
grant execute on function public.public_validate_cart_v1(jsonb,text,text) to anon,authenticated;

create or replace function public.admin_order_detail_v2(p_token text,p_id text) returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::public."AdminRole",'SALES'::public."AdminRole",'SUPPORT'::public."AdminRole") then raise exception 'forbidden'; end if;
 select jsonb_build_object(
  'id',o.id,'orderNumber',o."orderNumber",'customerName',o."customerName",'phone',o.phone,'email',o.email,'address',o.address,'province',o.province,'city',o.city,'country',o.country,'postalCode',o."postalCode",'notes',o.notes,'locale',o.locale,'currency',o.currency,'subtotal',o.subtotal,'shippingFee',o."shippingFee",'total',o.total,'status',o.status::text,'gateway',o.gateway::text,'paymentAuthority',o."paymentAuthority",'paymentRefId',o."paymentRefId",'createdAt',o."createdAt",'updatedAt',o."updatedAt",'reservationExpiresAt',o."reservationExpiresAt",
  'branch',case when b.id is null then null else jsonb_build_object('id',b.id,'code',b.code,'nameFa',b."nameFa",'nameTr',b."nameTr",'nameEn',b."nameEn",'nameAr',b."nameAr",'countryCode',b."countryCode",'currency',b.currency) end,
  'items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'productId',i."productId",'serviceId',i."serviceId",'variantId',i."variantId",'variantSkuSnapshot',i."variantSkuSnapshot",'variantAttributesSnapshot',i."variantAttributesSnapshot",'nameSnapshot',i."nameSnapshot",'priceSnapshot',i."priceSnapshot",'quantity',i.quantity,'preferredDate',i."preferredDate",'inventoryReserved',i."inventoryReserved",'warehouse',case when w.id is null then null else jsonb_build_object('id',w.id,'code',w.code,'nameFa',w."nameFa",'nameTr',w."nameTr",'nameEn',w."nameEn",'nameAr',w."nameAr") end) order by i.id) from public."OrderItem" i left join public."Warehouse" w on w.id=i."warehouseId" where i."orderId"=o.id),'[]'::jsonb)
 ) into v_result from public."Order" o left join public."Branch" b on b.id=o."branchId" where o.id=p_id;
 return v_result;
end $$;
revoke execute on function public.admin_order_detail_v2(text,text) from public;
grant execute on function public.admin_order_detail_v2(text,text) to anon,authenticated;
