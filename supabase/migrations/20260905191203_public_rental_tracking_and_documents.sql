create or replace function public.public_rental_request_status(p_rental_request_id text,p_phone text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_result jsonb;
begin
 if nullif(btrim(coalesce(p_rental_request_id,'')),'') is null or nullif(btrim(coalesce(p_phone,'')),'') is null then return null; end if;
 select jsonb_build_object(
  'rentalRequestId',r.id,'requestStatus',r.status,'createdAt',r."createdAt",'requestedQuantity',r."requestedQuantity",'preferredStartDate',r."preferredStartDate",'preferredEndDate',r."preferredEndDate",
  'approvedQuantity',r."approvedQuantity",'approvedStartDate',r."approvedStartDate",'approvedEndDate',r."approvedEndDate",'quotedAmount',r."quotedAmount",'quotedDeposit',r."quotedDeposit",
  'product',jsonb_build_object('id',p.id,'sku',p.sku,'modelNumber',p."modelNumber",'nameFa',p."nameFa",'nameTr',p."nameTr",'nameEn',p."nameEn",'nameAr',p."nameAr",'brandName',b.name),
  'branch',case when br.id is null then null else jsonb_build_object('id',br.id,'code',br.code,'nameFa',br."nameFa",'nameTr',br."nameTr",'nameEn',br."nameEn",'nameAr',br."nameAr",'countryCode',br."countryCode",'currency',br.currency) end,
  'lifecycleState',l.state,'contractNumber',l."contractNumber",'handoverAt',l."handoverAt",'returnedAt',l."returnedAt",'settledAt',l."settledAt",
  'hasContract',exists(select 1 from public."RentalDocumentSnapshot" d where d."rentalRequestId"=r.id and d."documentType"='CONTRACT'),
  'hasSettlement',exists(select 1 from public."RentalDocumentSnapshot" d where d."rentalRequestId"=r.id and d."documentType"='SETTLEMENT')
 ) into v_result
 from public."RentalRequest" r join public."Product" p on p.id=r."productId"
 left join public."Brand" b on b.id=p."brandId" left join public."Branch" br on br.id=r."branchId" left join public."RentalLifecycle" l on l."rentalRequestId"=r.id
 where r.id=btrim(p_rental_request_id)
 and regexp_replace(coalesce(r.phone,''),'[^0-9]','','g')=regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
 return v_result;
end $$;
revoke all on function public.public_rental_request_status(text,text) from public;
grant execute on function public.public_rental_request_status(text,text) to anon,authenticated;

create or replace function public.public_rental_document(p_rental_request_id text,p_phone text,p_document_type text)
returns jsonb language plpgsql security definer set search_path='public','extensions' as $$
declare v_doc public."RentalDocumentSnapshot"%rowtype; v_ok boolean; v_actual text; v_public jsonb;
begin
 if p_document_type not in ('CONTRACT','SETTLEMENT') then return null; end if;
 select exists(select 1 from public."RentalRequest" r where r.id=btrim(p_rental_request_id) and regexp_replace(coalesce(r.phone,''),'[^0-9]','','g')=regexp_replace(coalesce(p_phone,''),'[^0-9]','','g')) into v_ok;
 if not v_ok then return null; end if;
 select * into v_doc from public."RentalDocumentSnapshot" where "rentalRequestId"=btrim(p_rental_request_id) and "documentType"=p_document_type order by version desc limit 1;
 if not found then return null; end if;
 v_actual:=encode(extensions.digest(convert_to(v_doc.snapshot::text,'UTF8'),'sha256'),'hex');
 v_public:=v_doc.snapshot - 'email' - 'address' - 'handoverNotes';
 return jsonb_build_object('documentType',v_doc."documentType",'version',v_doc.version,'createdAt',v_doc."createdAt",'verified',v_actual=v_doc.sha256,'sha256',v_doc.sha256,'snapshot',v_public);
end $$;
revoke all on function public.public_rental_document(text,text,text) from public;
grant execute on function public.public_rental_document(text,text,text) to anon,authenticated;
