-- Versions 257-258: bulk launch activation for verified catalog staging.
create or replace function public.admin_catalog_staging_review_batch(
  p_token text,
  p_batch_id text,
  p_decision text default 'APPROVE'
) returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_decision text:=upper(btrim(coalesce(p_decision,'')));
  v_count integer:=0;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  if not exists(select 1 from public."CatalogStagingBatch" where id=p_batch_id and status<>'ARCHIVED') then raise exception 'staging batch not found'; end if;

  if v_decision='APPROVE' then
    update public."CatalogStagingItem"
       set status='APPROVED',"reviewedBy"=v_admin.id,"reviewedAt"=now(),"updatedAt"=now()
     where "batchId"=p_batch_id
       and status in ('VALID','NEEDS_REVIEW')
       and jsonb_array_length(coalesce(validation->'errors','[]'::jsonb))=0;
    get diagnostics v_count=row_count;
  elsif v_decision='REJECT' then
    update public."CatalogStagingItem"
       set status='REJECTED',"reviewedBy"=v_admin.id,"reviewedAt"=now(),"updatedAt"=now()
     where "batchId"=p_batch_id and status<>'PROMOTED';
    get diagnostics v_count=row_count;
  else
    raise exception 'decision must be APPROVE or REJECT';
  end if;

  update public."CatalogStagingBatch" set status=case when status='DRAFT' then 'IN_REVIEW' else status end,"updatedAt"=now() where id=p_batch_id;
  return jsonb_build_object('batchId',p_batch_id,'decision',v_decision,'updated',v_count);
end;
$function$;

create or replace function public.admin_catalog_staging_promote_batch(
  p_token text,
  p_batch_id text
) returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_item record;
  v_result jsonb;
  v_count integer:=0;
  v_products jsonb:='[]'::jsonb;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  if not exists(select 1 from public."CatalogStagingBatch" where id=p_batch_id and status<>'ARCHIVED') then raise exception 'staging batch not found'; end if;

  for v_item in
    select id from public."CatalogStagingItem"
     where "batchId"=p_batch_id and status='APPROVED'
     order by "rowNumber",id
     for update
  loop
    v_result:=public.admin_catalog_staging_promote_item(p_token,v_item.id);
    v_products:=v_products||jsonb_build_array(jsonb_build_object('stagingItemId',v_item.id,'productId',v_result->>'id'));
    v_count:=v_count+1;
  end loop;

  return jsonb_build_object('batchId',p_batch_id,'promoted',v_count,'products',v_products);
end;
$function$;

revoke all on function public.admin_catalog_staging_review_batch(text,text,text) from public,anon,authenticated;
revoke all on function public.admin_catalog_staging_promote_batch(text,text) from public,anon,authenticated;
grant execute on function public.admin_catalog_staging_review_batch(text,text,text) to service_role;
grant execute on function public.admin_catalog_staging_promote_batch(text,text) to service_role;
