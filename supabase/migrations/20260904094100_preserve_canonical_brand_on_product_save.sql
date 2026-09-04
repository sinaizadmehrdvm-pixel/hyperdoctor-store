create or replace function public.admin_upsert_product_v2(p_token text,p_data jsonb,p_images jsonb default '[]'::jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin public."AdminUser"%rowtype; v_existing_brand_id text; v_result jsonb; v_product_id text; v_brand_name text; begin
 v_admin:=public._admin_session_user(p_token); if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
 if nullif(trim(coalesce(p_data->>'id','')),'') is not null then select "brandId" into v_existing_brand_id from public."Product" where id=trim(p_data->>'id'); end if;
 v_result:=public.admin_upsert_product(p_token,p_data - 'brand',p_images); v_product_id:=v_result->>'id';
 if v_existing_brand_id is not null then select name into v_brand_name from public."Brand" where id=v_existing_brand_id; update public."Product" set "brandId"=v_existing_brand_id,brand=coalesce(v_brand_name,''),"updatedAt"=now() where id=v_product_id; end if;
 return v_result;
end $$;
revoke all on function public.admin_upsert_product_v2(text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.admin_upsert_product_v2(text,jsonb,jsonb) to service_role;
