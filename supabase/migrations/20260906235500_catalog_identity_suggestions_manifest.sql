alter table public."CatalogStagingItem"
  add column if not exists "suggestedSiteSku" text not null default '',
  add column if not exists "identityEvidence" jsonb not null default '{}'::jsonb;

create or replace function public.admin_catalog_staging_set_suggestion(p_token text,p_item_id text,p_suggested_site_sku text,p_evidence jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_item public."CatalogStagingItem"%rowtype;
  v_sku text:=btrim(coalesce(p_suggested_site_sku,''));
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select * into v_item from public."CatalogStagingItem" where id=p_item_id for update;
  if not found then raise exception 'staging item not found'; end if;
  if v_item.status='PROMOTED' then raise exception 'promoted staging item is immutable'; end if;
  if v_sku='' or length(v_sku)>100 or v_sku ~ '[[:space:]]' then raise exception 'invalid suggested site sku'; end if;
  if jsonb_typeof(coalesce(p_evidence,'{}'::jsonb))<>'object' then raise exception 'identity evidence must be an object'; end if;
  update public."CatalogStagingItem"
    set "suggestedSiteSku"=v_sku,"identityEvidence"=coalesce(p_evidence,'{}'::jsonb),"updatedAt"=now()
    where id=v_item.id returning * into v_item;
  return to_jsonb(v_item);
end $function$;

create or replace function public.admin_catalog_staging_identity_manifest(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare v_admin public."AdminUser"%rowtype; v_result jsonb;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'itemId',i.id,'batchId',b.id,'batchTitle',b.title,'sourceTitle',s.title,'sourceType',s."sourceType",
    'rowNumber',i."rowNumber",'sourceSku',i."sourceSku",'sourceModel',i."sourceModel",
    'siteSku',i."siteSku",'identityStatus',i."identityStatus",'suggestedSiteSku',i."suggestedSiteSku",
    'identityEvidence',i."identityEvidence",'categorySlug',i."categorySlug",'status',i.status,
    'nameFa',coalesce(i.payload->>'nameFa',''),'nameEn',coalesce(i.payload->>'nameEn','')
  ) order by b."createdAt",i."rowNumber"),'[]'::jsonb) into v_result
  from public."CatalogStagingItem" i
  join public."CatalogStagingBatch" b on b.id=i."batchId"
  join public."CatalogSource" s on s.id=b."sourceId"
  where b.status<>'ARCHIVED' and i.status<>'REJECTED';
  return jsonb_build_object(
    'items',v_result,
    'summary',jsonb_build_object(
      'total',jsonb_array_length(v_result),
      'verified',(select count(*) from public."CatalogStagingItem" i join public."CatalogStagingBatch" b on b.id=i."batchId" where b.status<>'ARCHIVED' and i.status<>'REJECTED' and i."identityStatus"='VERIFIED'),
      'suggested',(select count(*) from public."CatalogStagingItem" i join public."CatalogStagingBatch" b on b.id=i."batchId" where b.status<>'ARCHIVED' and i.status<>'REJECTED' and i."identityStatus"<>'VERIFIED' and btrim(i."suggestedSiteSku")<>''),
      'unresolved',(select count(*) from public."CatalogStagingItem" i join public."CatalogStagingBatch" b on b.id=i."batchId" where b.status<>'ARCHIVED' and i.status<>'REJECTED' and i."identityStatus"<>'VERIFIED')
    )
  );
end $function$;

revoke all on function public.admin_catalog_staging_set_suggestion(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_catalog_staging_set_suggestion(text,text,text,jsonb) to service_role;
revoke all on function public.admin_catalog_staging_identity_manifest(text) from public,anon,authenticated;
grant execute on function public.admin_catalog_staging_identity_manifest(text) to service_role;
