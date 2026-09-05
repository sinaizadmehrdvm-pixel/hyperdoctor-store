-- Version 222 — Production QA hardening
-- Harden public lookup RPCs against direct Data API calls with empty/weak phone input
-- and add covering indexes identified by Supabase performance advisor.

create or replace function public.track_order_public_v2(p_order_number text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
 v_result jsonb;
 v_phone text;
begin
 v_phone := regexp_replace(coalesce(btrim(p_phone),''),'[^0-9]','','g');
 if char_length(v_phone) < 8 or char_length(btrim(coalesce(p_order_number,''))) < 4 then return null; end if;
 select jsonb_build_object(
  'orderNumber',o."orderNumber",'status',o.status::text,'currency',o.currency,'subtotal',o.subtotal,'shippingFee',o."shippingFee",'total',o.total,
  'shippingMethod',o."shippingMethod",'trackingCode',o."trackingCode",'createdAt',o."createdAt",'shippedAt',o."shippedAt",'completedAt',o."completedAt",
  'branch',case when b.id is null then null else jsonb_build_object('code',b.code,'nameFa',b."nameFa",'nameTr',b."nameTr",'nameEn',b."nameEn",'nameAr',b."nameAr",'countryCode',b."countryCode",'currency',b.currency) end,
  'items',coalesce((select jsonb_agg(jsonb_build_object('name',i."nameSnapshot",'quantity',i.quantity,'price',i."priceSnapshot") order by i.id) from public."OrderItem" i where i."orderId"=o.id),'[]'::jsonb)
 ) into v_result
 from public."Order" o left join public."Branch" b on b.id=o."branchId"
 where upper(o."orderNumber")=upper(btrim(p_order_number))
   and regexp_replace(coalesce(o.phone,''),'[^0-9]','','g')=v_phone
 limit 1;
 return v_result;
end $$;

create or replace function public.public_rental_request_status(p_rental_request_id text,p_phone text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $$
declare
 v_result jsonb;
 v_phone text;
begin
 v_phone:=regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
 if char_length(v_phone)<8 or char_length(btrim(coalesce(p_rental_request_id,'')))<8 then return null; end if;
 select jsonb_build_object(
  'rentalRequestId',r.id,'requestStatus',r.status,'createdAt',r."createdAt",
  'requestedQuantity',r."requestedQuantity",'preferredStartDate',r."preferredStartDate",'preferredEndDate',r."preferredEndDate",
  'approvedQuantity',r."approvedQuantity",'approvedStartDate',r."approvedStartDate",'approvedEndDate',r."approvedEndDate",
  'quotedAmount',r."quotedAmount",'quotedDeposit',r."quotedDeposit",
  'product',jsonb_build_object('sku',p.sku,'modelNumber',p."modelNumber",'nameFa',p."nameFa",'nameTr',p."nameTr",'nameEn',p."nameEn",'nameAr',p."nameAr",'brandName',b.name),
  'branch',case when br.id is null then null else jsonb_build_object('code',br.code,'nameFa',br."nameFa",'nameTr',br."nameTr",'nameEn',br."nameEn",'nameAr',br."nameAr",'countryCode',br."countryCode",'currency',br.currency) end,
  'lifecycleState',l.state,'contractNumber',l."contractNumber",'handoverAt',l."handoverAt",'returnedAt',l."returnedAt",'settledAt',l."settledAt",
  'hasContract',exists(select 1 from public."RentalDocumentSnapshot" d where d."rentalRequestId"=r.id and d."documentType"='CONTRACT'),
  'hasSettlement',exists(select 1 from public."RentalDocumentSnapshot" d where d."rentalRequestId"=r.id and d."documentType"='SETTLEMENT')
 ) into v_result
 from public."RentalRequest" r
 join public."Product" p on p.id=r."productId"
 left join public."Brand" b on b.id=p."brandId"
 left join public."Branch" br on br.id=r."branchId"
 left join public."RentalLifecycle" l on l."rentalRequestId"=r.id
 where r.id=btrim(p_rental_request_id)
   and regexp_replace(coalesce(r.phone,''),'[^0-9]','','g')=v_phone
 limit 1;
 return v_result;
end $$;

create or replace function public.public_rental_document(p_rental_request_id text,p_phone text,p_document_type text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $$
declare
 v_doc public."RentalDocumentSnapshot"%rowtype;
 v_ok boolean;
 v_actual text;
 v_public jsonb;
 v_phone text;
begin
 v_phone:=regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
 if p_document_type not in ('CONTRACT','SETTLEMENT') or char_length(v_phone)<8 or char_length(btrim(coalesce(p_rental_request_id,'')))<8 then return null; end if;
 select exists(
  select 1 from public."RentalRequest" r
  where r.id=btrim(p_rental_request_id)
    and regexp_replace(coalesce(r.phone,''),'[^0-9]','','g')=v_phone
 ) into v_ok;
 if not v_ok then return null; end if;
 select * into v_doc from public."RentalDocumentSnapshot"
 where "rentalRequestId"=btrim(p_rental_request_id) and "documentType"=p_document_type
 order by version desc limit 1;
 if not found then return null; end if;
 v_actual:=encode(extensions.digest(convert_to(v_doc.snapshot::text,'UTF8'),'sha256'),'hex');
 v_public:=v_doc.snapshot - 'email' - 'address' - 'handoverNotes';
 return jsonb_build_object('documentType',v_doc."documentType",'version',v_doc.version,'createdAt',v_doc."createdAt",'verified',v_actual=v_doc.sha256,'sha256',v_doc.sha256,'snapshot',v_public);
end $$;

create index if not exists "BranchVariantPrice_variantId_idx" on public."BranchVariantPrice"("variantId");
create index if not exists "CouponRedemption_orderId_idx" on public."CouponRedemption"("orderId");
create index if not exists "Order_couponId_idx" on public."Order"("couponId");
create index if not exists "OrderItem_orderId_idx" on public."OrderItem"("orderId");
create index if not exists "OrderItem_serviceId_idx" on public."OrderItem"("serviceId");
create index if not exists "ProductRelation_relatedProductId_idx" on public."ProductRelation"("relatedProductId");
create index if not exists "RentalFinancialEntry_createdByAdminId_idx" on public."RentalFinancialEntry"("createdByAdminId");
create index if not exists "RespiratoryServiceReportVersion_createdBy_idx" on public."RespiratoryServiceReportVersion"("createdBy");
create index if not exists "Review_customerId_idx" on public."Review"("customerId");
create index if not exists "StockMovement_productId_idx" on public."StockMovement"("productId");
create index if not exists "SupportTicket_customerId_idx" on public."SupportTicket"("customerId");
