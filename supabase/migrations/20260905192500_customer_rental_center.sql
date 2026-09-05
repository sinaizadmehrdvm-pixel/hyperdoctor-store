create or replace function public.customer_rentals(p_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','extensions'
as $$
declare
 ident jsonb;
 v_phone text;
 v_email text;
begin
 ident:=public.customer_validate_session(p_token);
 if ident is null then raise exception 'unauthorized'; end if;
 v_phone:=regexp_replace(coalesce(ident->>'phone',''),'[^0-9]','','g');
 v_email:=lower(btrim(coalesce(ident->>'email','')));
 if v_phone='' and v_email='' then return '[]'::jsonb; end if;
 return coalesce((
  select jsonb_agg(jsonb_build_object(
   'rentalRequestId',r.id,
   'requestStatus',r.status,
   'createdAt',r."createdAt",
   'requestedQuantity',r."requestedQuantity",
   'preferredStartDate',r."preferredStartDate",
   'preferredEndDate',r."preferredEndDate",
   'approvedQuantity',r."approvedQuantity",
   'approvedStartDate',r."approvedStartDate",
   'approvedEndDate',r."approvedEndDate",
   'quotedAmount',r."quotedAmount",
   'quotedDeposit',r."quotedDeposit",
   'product',jsonb_build_object('id',p.id,'sku',p.sku,'modelNumber',p."modelNumber",'nameFa',p."nameFa",'nameTr',p."nameTr",'nameEn',p."nameEn",'nameAr',p."nameAr",'brandName',b.name),
   'branch',case when br.id is null then null else jsonb_build_object('id',br.id,'code',br.code,'nameFa',br."nameFa",'nameTr',br."nameTr",'nameEn',br."nameEn",'nameAr',br."nameAr",'countryCode',br."countryCode",'currency',br.currency) end,
   'lifecycleState',l.state,
   'contractNumber',l."contractNumber",
   'handoverAt',l."handoverAt",
   'returnedAt',l."returnedAt",
   'settledAt',l."settledAt",
   'hasContract',exists(select 1 from public."RentalDocumentSnapshot" d where d."rentalRequestId"=r.id and d."documentType"='CONTRACT'),
   'hasSettlement',exists(select 1 from public."RentalDocumentSnapshot" d where d."rentalRequestId"=r.id and d."documentType"='SETTLEMENT')
  ) order by r."createdAt" desc)
  from public."RentalRequest" r
  join public."Product" p on p.id=r."productId"
  left join public."Brand" b on b.id=p."brandId"
  left join public."Branch" br on br.id=r."branchId"
  left join public."RentalLifecycle" l on l."rentalRequestId"=r.id
  where (v_phone<>'' and regexp_replace(coalesce(r.phone,''),'[^0-9]','','g')=v_phone)
     or (v_email<>'' and lower(btrim(coalesce(r.email,'')))=v_email)
 ),'[]'::jsonb);
end $$;

revoke all on function public.customer_rentals(text) from public;
grant execute on function public.customer_rentals(text) to anon,authenticated;
