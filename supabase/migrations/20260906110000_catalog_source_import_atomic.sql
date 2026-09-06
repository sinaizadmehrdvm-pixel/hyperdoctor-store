-- Version 248: atomically upsert a product and attach its source evidence.

create or replace function public.admin_import_product_row_with_source(
  p_token text,
  p_row jsonb,
  p_images jsonb,
  p_source_id text,
  p_snapshot jsonb,
  p_price_kind text default null,
  p_observed_price bigint default null,
  p_currency text default 'IRT'
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare
  v_admin public."AdminUser"%rowtype;
  v_result jsonb;
  v_product_id text;
begin
  v_admin := public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole", 'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;

  v_result := public.admin_import_product_row(p_token, p_row, p_images);
  v_product_id := v_result->>'id';
  if coalesce(v_product_id,'') = '' then raise exception 'product import returned no id'; end if;

  perform public.admin_product_source_attach(
    p_token,
    v_product_id,
    p_source_id,
    coalesce(p_snapshot,'{}'::jsonb),
    p_price_kind,
    p_observed_price,
    p_currency
  );

  return v_result || jsonb_build_object('sourceId',p_source_id,'provenanceAttached',true);
end
$function$;

revoke all on function public.admin_import_product_row_with_source(text,jsonb,jsonb,text,jsonb,text,bigint,text) from public, anon, authenticated;
grant execute on function public.admin_import_product_row_with_source(text,jsonb,jsonb,text,jsonb,text,bigint,text) to service_role;
