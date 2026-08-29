create or replace function public.admin_upsert_article(p_token text, p_data jsonb)
returns text
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_id text := nullif(p_data->>'id','');
  v_slug text := lower(regexp_replace(coalesce(nullif(p_data->>'slug',''),p_data->>'titleEn'),'[^a-zA-Z0-9]+','-','g'));
  v_pub boolean := coalesce((p_data->>'isPublished')::boolean,false);
  v_requested_pub timestamptz := null;
begin
  if public.admin_validate_session(p_token) is null then raise exception 'unauthorized'; end if;
  v_slug := trim(both '-' from v_slug);
  if v_slug='' then raise exception 'slug_required'; end if;
  if v_pub and nullif(p_data->>'publishedAt','') is not null then
    v_requested_pub := (p_data->>'publishedAt')::timestamptz;
  end if;

  if v_id is null then
    v_id := replace(gen_random_uuid()::text,'-','');
    insert into public."Article"(id,slug,"titleFa","titleTr","titleEn","titleAr","excerptFa","excerptTr","excerptEn","excerptAr","contentFa","contentTr","contentEn","contentAr","coverImage",category,tags,"isPublished","publishedAt","updatedAt")
    values(v_id,v_slug,coalesce(p_data->>'titleFa',''),coalesce(p_data->>'titleTr',''),coalesce(p_data->>'titleEn',''),coalesce(p_data->>'titleAr',''),coalesce(p_data->>'excerptFa',''),coalesce(p_data->>'excerptTr',''),coalesce(p_data->>'excerptEn',''),coalesce(p_data->>'excerptAr',''),coalesce(p_data->>'contentFa',''),coalesce(p_data->>'contentTr',''),coalesce(p_data->>'contentEn',''),coalesce(p_data->>'contentAr',''),coalesce(p_data->>'coverImage',''),coalesce(p_data->>'category',''),coalesce(nullif(p_data->>'tags',''),'[]'),v_pub,case when v_pub then coalesce(v_requested_pub,now()) else null end,now());
  else
    update public."Article"
    set slug=v_slug,"titleFa"=coalesce(p_data->>'titleFa',''),"titleTr"=coalesce(p_data->>'titleTr',''),"titleEn"=coalesce(p_data->>'titleEn',''),"titleAr"=coalesce(p_data->>'titleAr',''),"excerptFa"=coalesce(p_data->>'excerptFa',''),"excerptTr"=coalesce(p_data->>'excerptTr',''),"excerptEn"=coalesce(p_data->>'excerptEn',''),"excerptAr"=coalesce(p_data->>'excerptAr',''),"contentFa"=coalesce(p_data->>'contentFa',''),"contentTr"=coalesce(p_data->>'contentTr',''),"contentEn"=coalesce(p_data->>'contentEn',''),"contentAr"=coalesce(p_data->>'contentAr',''),"coverImage"=coalesce(p_data->>'coverImage',''),category=coalesce(p_data->>'category',''),tags=coalesce(nullif(p_data->>'tags',''),'[]'),"isPublished"=v_pub,"publishedAt"=case when v_pub then coalesce(v_requested_pub,now()) else null end,"updatedAt"=now()
    where id=v_id;
  end if;
  return v_id;
end
$function$;
