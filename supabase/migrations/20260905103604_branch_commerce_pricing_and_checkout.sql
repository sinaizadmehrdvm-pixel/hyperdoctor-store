create table if not exists public."BranchCommercePolicy" (
  "branchId" text primary key references public."Branch"(id) on delete cascade,
  "salesEnabled" boolean not null default false,
  "paymentGateway" text not null default 'DISABLED' check ("paymentGateway" in ('ZARINPAL','MANUAL','DISABLED')),
  "updatedAt" timestamptz not null default now()
);
create table if not exists public."BranchProductPrice" (
  "branchId" text not null references public."Branch"(id) on delete cascade,
  "productId" text not null references public."Product"(id) on delete cascade,
  price integer not null check (price > 0),
  "compareAtPrice" integer null check ("compareAtPrice" is null or "compareAtPrice" > 0),
  "isActive" boolean not null default true,
  "updatedAt" timestamptz not null default now(),
  primary key ("branchId","productId")
);
create table if not exists public."BranchVariantPrice" (
  "branchId" text not null references public."Branch"(id) on delete cascade,
  "variantId" text not null references public."ProductVariant"(id) on delete cascade,
  "productId" text not null references public."Product"(id) on delete cascade,
  price integer not null check (price > 0),
  "compareAtPrice" integer null check ("compareAtPrice" is null or "compareAtPrice" > 0),
  "isActive" boolean not null default true,
  "updatedAt" timestamptz not null default now(),
  primary key ("branchId","variantId")
);
create index if not exists "BranchProductPrice_product_idx" on public."BranchProductPrice"("productId");
create index if not exists "BranchVariantPrice_product_idx" on public."BranchVariantPrice"("productId");
alter table public."BranchCommercePolicy" enable row level security;
alter table public."BranchProductPrice" enable row level security;
alter table public."BranchVariantPrice" enable row level security;
revoke all on public."BranchCommercePolicy",public."BranchProductPrice",public."BranchVariantPrice" from anon,authenticated;

insert into public."BranchCommercePolicy"("branchId","salesEnabled","paymentGateway")
select id,true,'ZARINPAL' from public."Branch" where code='IRAN' and "countryCode"='IR'
on conflict ("branchId") do nothing;

create or replace function public.public_store_commerce(p_branch_id text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_branch public."Branch"%rowtype; v_policy public."BranchCommercePolicy"%rowtype;
begin
  if nullif(btrim(coalesce(p_branch_id,'')),'') is not null then
    select * into v_branch from public."Branch" where id=p_branch_id and "isPublished"=true limit 1;
  else
    select * into v_branch from public."Branch" where "isPublished"=true order by "isDefault" desc,"createdAt" asc limit 1;
  end if;
  if not found then return null; end if;
  select * into v_policy from public."BranchCommercePolicy" where "branchId"=v_branch.id;
  return jsonb_build_object(
    'branchId',v_branch.id,'branchCode',v_branch.code,'countryCode',v_branch."countryCode",'currency',v_branch.currency,
    'salesEnabled',coalesce(v_policy."salesEnabled",false),'paymentGateway',coalesce(v_policy."paymentGateway",'DISABLED'),
    'productPrices',coalesce((select jsonb_agg(jsonb_build_object('productId',p."productId",'price',p.price,'compareAtPrice',p."compareAtPrice")) from public."BranchProductPrice" p where p."branchId"=v_branch.id and p."isActive"=true),'[]'::jsonb),
    'variantPrices',coalesce((select jsonb_agg(jsonb_build_object('variantId',p."variantId",'productId',p."productId",'price',p.price,'compareAtPrice',p."compareAtPrice")) from public."BranchVariantPrice" p where p."branchId"=v_branch.id and p."isActive"=true),'[]'::jsonb)
  );
end $$;
revoke all on function public.public_store_commerce(text) from public;
grant execute on function public.public_store_commerce(text) to anon,authenticated;

create or replace function public.admin_branch_commerce_bundle(p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_role text;
begin
  select public._admin_role(p_token) into v_role;
  if v_role not in ('SUPER_ADMIN','SALES') then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'branches',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'code',b.code,'nameFa',b."nameFa",'nameTr',b."nameTr",'nameEn',b."nameEn",'nameAr',b."nameAr",'countryCode',b."countryCode",'currency',b.currency,'salesEnabled',coalesce(cp."salesEnabled",false),'paymentGateway',coalesce(cp."paymentGateway",'DISABLED')) order by b."isDefault" desc,b."createdAt") from public."Branch" b left join public."BranchCommercePolicy" cp on cp."branchId"=b.id),'[]'::jsonb),
    'productPrices',coalesce((select jsonb_agg(to_jsonb(x)) from (select bp."branchId",bp."productId",bp.price,bp."compareAtPrice",bp."isActive",p.sku,p."nameFa",p."nameTr",p."nameEn",p."nameAr" from public."BranchProductPrice" bp join public."Product" p on p.id=bp."productId" order by p.sku) x),'[]'::jsonb),
    'variantPrices',coalesce((select jsonb_agg(to_jsonb(x)) from (select vp."branchId",vp."variantId",vp."productId",vp.price,vp."compareAtPrice",vp."isActive",v.sku,v.name from public."BranchVariantPrice" vp join public."ProductVariant" v on v.id=vp."variantId" order by v.sku) x),'[]'::jsonb)
  );
end $$;

create or replace function public.admin_upsert_branch_commerce_policy(p_token text,p_branch_id text,p_sales_enabled boolean,p_payment_gateway text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if public._admin_role(p_token) <> 'SUPER_ADMIN' then raise exception 'forbidden'; end if;
  if p_payment_gateway not in ('ZARINPAL','MANUAL','DISABLED') then raise exception 'invalid gateway'; end if;
  if not exists(select 1 from public."Branch" where id=p_branch_id) then raise exception 'branch not found'; end if;
  insert into public."BranchCommercePolicy"("branchId","salesEnabled","paymentGateway","updatedAt") values(p_branch_id,coalesce(p_sales_enabled,false),p_payment_gateway,now())
  on conflict ("branchId") do update set "salesEnabled"=excluded."salesEnabled","paymentGateway"=excluded."paymentGateway","updatedAt"=now();
  return true;
end $$;

create or replace function public.admin_upsert_branch_product_price(p_token text,p_branch_id text,p_product_id text,p_price integer,p_compare_at_price integer default null,p_is_active boolean default true)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if public._admin_role(p_token) not in ('SUPER_ADMIN','SALES') then raise exception 'forbidden'; end if;
  if p_price is null or p_price<=0 then raise exception 'invalid price'; end if;
  if not exists(select 1 from public."Branch" where id=p_branch_id) or not exists(select 1 from public."Product" where id=p_product_id) then raise exception 'not found'; end if;
  insert into public."BranchProductPrice"("branchId","productId",price,"compareAtPrice","isActive","updatedAt") values(p_branch_id,p_product_id,p_price,p_compare_at_price,coalesce(p_is_active,true),now())
  on conflict ("branchId","productId") do update set price=excluded.price,"compareAtPrice"=excluded."compareAtPrice","isActive"=excluded."isActive","updatedAt"=now();
  return true;
end $$;

create or replace function public.admin_upsert_branch_variant_price(p_token text,p_branch_id text,p_variant_id text,p_price integer,p_compare_at_price integer default null,p_is_active boolean default true)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_product_id text;
begin
  if public._admin_role(p_token) not in ('SUPER_ADMIN','SALES') then raise exception 'forbidden'; end if;
  if p_price is null or p_price<=0 then raise exception 'invalid price'; end if;
  select "productId" into v_product_id from public."ProductVariant" where id=p_variant_id;
  if v_product_id is null or not exists(select 1 from public."Branch" where id=p_branch_id) then raise exception 'not found'; end if;
  insert into public."BranchVariantPrice"("branchId","variantId","productId",price,"compareAtPrice","isActive","updatedAt") values(p_branch_id,p_variant_id,v_product_id,p_price,p_compare_at_price,coalesce(p_is_active,true),now())
  on conflict ("branchId","variantId") do update set "productId"=excluded."productId",price=excluded.price,"compareAtPrice"=excluded."compareAtPrice","isActive"=excluded."isActive","updatedAt"=now();
  return true;
end $$;

revoke all on function public.admin_branch_commerce_bundle(text),public.admin_upsert_branch_commerce_policy(text,text,boolean,text),public.admin_upsert_branch_product_price(text,text,text,integer,integer,boolean),public.admin_upsert_branch_variant_price(text,text,text,integer,integer,boolean) from public;
grant execute on function public.admin_branch_commerce_bundle(text),public.admin_upsert_branch_commerce_policy(text,text,boolean,text),public.admin_upsert_branch_product_price(text,text,text,integer,integer,boolean),public.admin_upsert_branch_variant_price(text,text,text,integer,integer,boolean) to anon,authenticated;

create or replace function public.create_guest_order_v4(p_request_token uuid,p_customer_name text,p_phone text,p_email text,p_address text,p_province text,p_city text,p_country text,p_postal_code text,p_notes text,p_locale text,p_lines jsonb,p_branch_id text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb;v_order_id text;v_branch_id text;v_policy public."BranchCommercePolicy"%rowtype;v_currency text;v_subtotal bigint;
begin
  v_branch_id:=nullif(btrim(coalesce(p_branch_id,'')),'');
  if v_branch_id is null then select id into v_branch_id from public."Branch" where "isPublished"=true order by "isDefault" desc,"createdAt" asc limit 1; end if;
  if v_branch_id is null then raise exception 'branch unavailable'; end if;
  select * into v_policy from public."BranchCommercePolicy" where "branchId"=v_branch_id;
  if not found or not coalesce(v_policy."salesEnabled",false) then raise exception 'branch checkout disabled'; end if;
  if v_policy."paymentGateway" <> 'ZARINPAL' then raise exception 'payment gateway unavailable for branch'; end if;
  select currency into v_currency from public."Branch" where id=v_branch_id and "isPublished"=true;
  if v_currency is null then raise exception 'branch unavailable'; end if;
  v_result:=public.create_guest_order_v3(p_request_token,p_customer_name,p_phone,p_email,p_address,p_province,p_city,p_country,p_postal_code,p_notes,p_locale,p_lines,v_branch_id);
  v_order_id:=v_result->>'orderId';
  if v_order_id is null then raise exception 'order unavailable'; end if;
  update public."OrderItem" oi set "priceSnapshot"=coalesce(case when oi."variantId" is not null then (select vp.price from public."BranchVariantPrice" vp where vp."branchId"=v_branch_id and vp."variantId"=oi."variantId" and vp."isActive"=true) end,(select bp.price from public."BranchProductPrice" bp where bp."branchId"=v_branch_id and bp."productId"=oi."productId" and bp."isActive"=true),oi."priceSnapshot") where oi."orderId"=v_order_id and oi."productId" is not null;
  select coalesce(sum(oi."priceSnapshot"::bigint*oi.quantity::bigint),0) into v_subtotal from public."OrderItem" oi where oi."orderId"=v_order_id;
  if v_subtotal<=0 or v_subtotal>2147483647 then raise exception 'invalid order total'; end if;
  update public."Order" set currency=v_currency,subtotal=v_subtotal::int,total=(v_subtotal-"discountAmount"+"shippingFee")::int,gateway='ZARINPAL'::public."PaymentGateway","updatedAt"=now() where id=v_order_id;
  select jsonb_build_object('orderId',o.id,'orderNumber',o."orderNumber",'total',o.total,'checkoutToken',o."checkoutToken",'resultToken',o."resultToken",'status',o.status::text,'reservationExpiresAt',o."reservationExpiresAt",'branchId',o."branchId",'currency',o.currency,'gateway',o.gateway::text) into v_result from public."Order" o where o.id=v_order_id;
  return v_result;
end $$;
revoke all on function public.create_guest_order_v4(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text) from public;
grant execute on function public.create_guest_order_v4(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text) to anon,authenticated;
