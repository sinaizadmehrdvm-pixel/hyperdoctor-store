create or replace function public.customer_rental_document(p_token text,p_rental_request_id text,p_document_type text)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
 ident jsonb;
 v_phone text;
 v_email text;
 v_doc public."RentalDocumentSnapshot"%rowtype;
 v_ok boolean;
 v_actual text;
 v_public jsonb;
begin
 ident:=public.customer_validate_session(p_token);
 if ident is null then raise exception 'unauthorized'; end if;
 if p_document_type not in ('CONTRACT','SETTLEMENT') then return null; end if;
 v_phone:=regexp_replace(coalesce(ident->>'phone',''),'[^0-9]','','g');
 v_email:=lower(btrim(coalesce(ident->>'email','')));
 select exists(
  select 1 from public."RentalRequest" r
  where r.id=btrim(p_rental_request_id)
    and ((v_phone<>'' and regexp_replace(coalesce(r.phone,''),'[^0-9]','','g')=v_phone)
      or (v_email<>'' and lower(btrim(coalesce(r.email,'')))=v_email))
 ) into v_ok;
 if not v_ok then return null; end if;
 select * into v_doc from public."RentalDocumentSnapshot"
 where "rentalRequestId"=btrim(p_rental_request_id) and "documentType"=p_document_type
 order by version desc limit 1;
 if not found then return null; end if;
 v_actual:=encode(extensions.digest(convert_to(v_doc.snapshot::text,'UTF8'),'sha256'),'hex');
 v_public:=v_doc.snapshot - 'email' - 'address' - 'handoverNotes';
 return jsonb_build_object(
  'documentType',v_doc."documentType",
  'version',v_doc.version,
  'createdAt',v_doc."createdAt",
  'verified',v_actual=v_doc.sha256,
  'sha256',v_doc.sha256,
  'snapshot',v_public
 );
end $$;

revoke all on function public.customer_rental_document(text,text,text) from public;
grant execute on function public.customer_rental_document(text,text,text) to anon,authenticated;

create or replace function public.customer_rental_detail(p_token text,p_rental_request_id text)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
 ident jsonb;
 v_phone text;
 v_email text;
 result jsonb;
begin
 ident:=public.customer_validate_session(p_token);
 if ident is null then raise exception 'unauthorized'; end if;
 v_phone:=regexp_replace(coalesce(ident->>'phone',''),'[^0-9]','','g');
 v_email:=lower(btrim(coalesce(ident->>'email','')));
 select jsonb_build_object(
  'rentalRequestId',r.id,'requestStatus',r.status,'createdAt',r."createdAt",'requestedQuantity',r."requestedQuantity",
  'preferredStartDate',r."preferredStartDate",'preferredEndDate',r."preferredEndDate",'approvedQuantity',r."approvedQuantity",
  'approvedStartDate',r."approvedStartDate",'approvedEndDate',r."approvedEndDate",'quotedAmount',r."quotedAmount",'quotedDeposit',r."quotedDeposit",'notes',r.notes,
  'product',jsonb_build_object('id',p.id,'sku',p.sku,'modelNumber',p."modelNumber",'nameFa',p."nameFa",'nameTr',p."nameTr",'nameEn',p."nameEn",'nameAr',p."nameAr",'brandName',b.name),
  'branch',case when br.id is null then null else jsonb_build_object('id',br.id,'code',br.code,'nameFa',br."nameFa",'nameTr',br."nameTr",'nameEn',br."nameEn",'nameAr',br."nameAr",'countryCode',br."countryCode",'currency',br.currency) end,
  'lifecycle',case when l."rentalRequestId" is null then null else jsonb_build_object('state',l.state,'contractNumber',l."contractNumber",'handoverAt',l."handoverAt",'returnedAt',l."returnedAt",'settledAt',l."settledAt") end,
  'documents',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'documentType',d."documentType",'version',d.version,'sha256',d.sha256,'createdAt',d."createdAt") order by d."documentType",d.version desc) from public."RentalDocumentSnapshot" d where d."rentalRequestId"=r.id),'[]'::jsonb)
 ) into result
 from public."RentalRequest" r
 join public."Product" p on p.id=r."productId"
 left join public."Brand" b on b.id=p."brandId"
 left join public."Branch" br on br.id=r."branchId"
 left join public."RentalLifecycle" l on l."rentalRequestId"=r.id
 where r.id=p_rental_request_id
   and ((v_phone<>'' and regexp_replace(coalesce(r.phone,''),'[^0-9]','','g')=v_phone)
     or (v_email<>'' and lower(btrim(coalesce(r.email,'')))=v_email));
 return result;
end $$;
