create or replace function public.public_catalog_facets_v2(
  p_category_slug text default null,
  p_search text default null,
  p_brand_id text default null,
  p_term_ids text[] default '{}'::text[],
  p_use text default null,
  p_attributes jsonb default '[]'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_category_slug text := nullif(lower(btrim(coalesce(p_category_slug,''))), '');
  v_category_id text;
  v_search text := nullif(lower(left(btrim(coalesce(p_search,'')),120)), '');
  v_brand_id text := nullif(btrim(coalesce(p_brand_id,'')), '');
  v_use text := case when p_use in ('rental','professional','home') then p_use else null end;
  v_terms text[] := coalesce(p_term_ids,'{}'::text[]);
  v_attrs jsonb := case when jsonb_typeof(coalesce(p_attributes,'[]'::jsonb))='array' then coalesce(p_attributes,'[]'::jsonb) else '[]'::jsonb end;
  v_result jsonb;
begin
  if cardinality(v_terms)>12 then v_terms:=v_terms[1:12]; end if;
  if v_category_slug is not null then
    select c.id into v_category_id from public."Category" c where c.slug=v_category_slug and c."isPublished"=true limit 1;
    if v_category_id is null then
      return jsonb_build_object('resultCount',0,'brands','[]'::jsonb,'terms','[]'::jsonb,'attributes','[]'::jsonb,'useProfiles','[]'::jsonb);
    end if;
  end if;

  with
  attr_filters as (
    select left(e.value->>'definitionId',160) as definition_id,left(btrim(e.value->>'value'),100) as value
    from jsonb_array_elements(v_attrs) with ordinality e(value,ord)
    where e.ord<=12 and jsonb_typeof(e.value)='object' and coalesce(e.value->>'definitionId','')<>'' and coalesce(btrim(e.value->>'value'),'')<>''
  ),
  term_filters as (
    select distinct x as term_id from unnest(v_terms) x where nullif(btrim(x),'') is not null
  ),
  selected_terms as (
    select tf.term_id,t.dimension from term_filters tf join public."TaxonomyTerm" t on t.id=tf.term_id and t."isPublished"=true
  ),
  universe as (
    select p.*
    from public."Product" p
    left join public."Brand" pb on pb.id=p."brandId"
    where p."isPublished"=true
      and (v_category_id is null or p."categoryId"=v_category_id or exists(select 1 from public."ProductSecondaryCategory" sc where sc."productId"=p.id and sc."categoryId"=v_category_id))
      and (v_search is null or lower(concat_ws(' ',p."nameFa",p."nameTr",p."nameEn",p."nameAr",p."modelNumber",p.sku,p.brand,pb.name)) like '%'||v_search||'%')
  ),
  filtered as (
    select u.id
    from universe u
    where (v_brand_id is null or u."brandId"=v_brand_id)
      and (v_use is null or (v_use='rental' and u."rentalEligible"=true) or (v_use='professional' and u."professionalUse"=true) or (v_use='home' and u."homeUse"=true))
      and not exists(select 1 from term_filters tf where not exists(select 1 from public."ProductTaxonomy" pt where pt."productId"=u.id and pt."termId"=tf.term_id))
      and not exists(
        select 1 from attr_filters af
        where not exists(
          select 1 from public."ProductAttributeValue" av
          join public."ProductAttributeDefinition" d on d.id=av."definitionId" and d."isPublished"=true and d."isFilterable"=true
          where av."productId"=u.id and av."definitionId"=af.definition_id
            and (case d."dataType" when 'BOOLEAN' then lower(av."valueBoolean"::text) when 'NUMBER' then regexp_replace(regexp_replace(av."valueNumber"::text,'(\.\d*?)0+$','\1'),'\.$','') else btrim(coalesce(av."valueText",'')) end)=af.value
        )
      )
  ),
  no_brand as (
    select u.id,u."brandId" from universe u
    where (v_use is null or (v_use='rental' and u."rentalEligible"=true) or (v_use='professional' and u."professionalUse"=true) or (v_use='home' and u."homeUse"=true))
      and not exists(select 1 from term_filters tf where not exists(select 1 from public."ProductTaxonomy" pt where pt."productId"=u.id and pt."termId"=tf.term_id))
      and not exists(select 1 from attr_filters af where not exists(select 1 from public."ProductAttributeValue" av join public."ProductAttributeDefinition" d on d.id=av."definitionId" and d."isPublished"=true and d."isFilterable"=true where av."productId"=u.id and av."definitionId"=af.definition_id and (case d."dataType" when 'BOOLEAN' then lower(av."valueBoolean"::text) when 'NUMBER' then regexp_replace(regexp_replace(av."valueNumber"::text,'(\.\d*?)0+$','\1'),'\.$','') else btrim(coalesce(av."valueText",'')) end)=af.value))
  ),
  brand_rows as (
    select b.id,b.name,b.slug,count(nb.id)::int as count
    from public."Brand" b join no_brand nb on nb."brandId"=b.id
    where b."isPublished"=true
    group by b.id,b.name,b.slug
    having count(nb.id)>0
  ),
  no_tax_base as (
    select u.* from universe u
    where (v_brand_id is null or u."brandId"=v_brand_id)
      and (v_use is null or (v_use='rental' and u."rentalEligible"=true) or (v_use='professional' and u."professionalUse"=true) or (v_use='home' and u."homeUse"=true))
      and not exists(select 1 from attr_filters af where not exists(select 1 from public."ProductAttributeValue" av join public."ProductAttributeDefinition" d on d.id=av."definitionId" and d."isPublished"=true and d."isFilterable"=true where av."productId"=u.id and av."definitionId"=af.definition_id and (case d."dataType" when 'BOOLEAN' then lower(av."valueBoolean"::text) when 'NUMBER' then regexp_replace(regexp_replace(av."valueNumber"::text,'(\.\d*?)0+$','\1'),'\.$','') else btrim(coalesce(av."valueText",'')) end)=af.value))
  ),
  term_rows as (
    select t.id,t.dimension::text as dimension,t.slug,t."nameFa",t."nameTr",t."nameEn",t."nameAr",t."sortOrder",
      count(*) filter(where exists(select 1 from public."ProductTaxonomy" cand where cand."productId"=u.id and cand."termId"=t.id)
        and not exists(select 1 from selected_terms st where st.dimension<>t.dimension and not exists(select 1 from public."ProductTaxonomy" pt where pt."productId"=u.id and pt."termId"=st.term_id)))::int as count
    from public."TaxonomyTerm" t cross join no_tax_base u
    where t."isPublished"=true
    group by t.id,t.dimension,t.slug,t."nameFa",t."nameTr",t."nameEn",t."nameAr",t."sortOrder"
  ),
  no_attr_base as (
    select u.* from universe u
    where (v_brand_id is null or u."brandId"=v_brand_id)
      and (v_use is null or (v_use='rental' and u."rentalEligible"=true) or (v_use='professional' and u."professionalUse"=true) or (v_use='home' and u."homeUse"=true))
      and not exists(select 1 from term_filters tf where not exists(select 1 from public."ProductTaxonomy" pt where pt."productId"=u.id and pt."termId"=tf.term_id))
  ),
  normalized_values as (
    select av."productId",d.id as definition_id,d.code,d."nameFa",d."nameTr",d."nameEn",d."nameAr",d."dataType",d.unit,d."sortOrder",
      case d."dataType" when 'BOOLEAN' then lower(av."valueBoolean"::text) when 'NUMBER' then regexp_replace(regexp_replace(av."valueNumber"::text,'(\.\d*?)0+$','\1'),'\.$','') else btrim(coalesce(av."valueText",'')) end as value
    from public."ProductAttributeValue" av join public."ProductAttributeDefinition" d on d.id=av."definitionId"
    where d."isPublished"=true and d."isFilterable"=true
  ),
  attr_choice_rows as (
    select nv.definition_id,nv.code,nv."nameFa",nv."nameTr",nv."nameEn",nv."nameAr",nv."dataType",nv.unit,nv."sortOrder",nv.value,
      count(distinct u.id)::int as count
    from normalized_values nv join no_attr_base u on u.id=nv."productId"
    where nv.value<>''
      and not exists(
        select 1 from attr_filters af
        where af.definition_id<>nv.definition_id and not exists(
          select 1 from normalized_values other where other."productId"=u.id and other.definition_id=af.definition_id and other.value=af.value
        )
      )
    group by nv.definition_id,nv.code,nv."nameFa",nv."nameTr",nv."nameEn",nv."nameAr",nv."dataType",nv.unit,nv."sortOrder",nv.value
  ),
  attribute_rows as (
    select definition_id as id,code,"nameFa","nameTr","nameEn","nameAr","dataType",unit,"sortOrder",
      jsonb_agg(jsonb_build_object('value',value,'count',count) order by case when "dataType"='NUMBER' then nullif(value,'')::numeric end nulls last,value) as choices
    from attr_choice_rows where count>0
    group by definition_id,code,"nameFa","nameTr","nameEn","nameAr","dataType",unit,"sortOrder"
  ),
  no_use as (
    select u.* from universe u
    where (v_brand_id is null or u."brandId"=v_brand_id)
      and not exists(select 1 from term_filters tf where not exists(select 1 from public."ProductTaxonomy" pt where pt."productId"=u.id and pt."termId"=tf.term_id))
      and not exists(select 1 from attr_filters af where not exists(select 1 from normalized_values nv where nv."productId"=u.id and nv.definition_id=af.definition_id and nv.value=af.value))
  ),
  use_rows as (
    select v.value,count(*) filter(where (v.value='rental' and u."rentalEligible"=true) or (v.value='professional' and u."professionalUse"=true) or (v.value='home' and u."homeUse"=true))::int as count
    from (values('rental'),('professional'),('home')) v(value) cross join no_use u group by v.value
  )
  select jsonb_build_object(
    'resultCount',(select count(*)::int from filtered),
    'brands',coalesce((select jsonb_agg(to_jsonb(b) order by b.name) from brand_rows b),'[]'::jsonb),
    'terms',coalesce((select jsonb_agg(to_jsonb(t)-'sortOrder' order by t.dimension,t."sortOrder",t."nameEn") from term_rows t where t.count>0),'[]'::jsonb),
    'attributes',coalesce((select jsonb_agg(to_jsonb(a)-'sortOrder' order by a."sortOrder",a."nameEn") from attribute_rows a),'[]'::jsonb),
    'useProfiles',coalesce((select jsonb_agg(to_jsonb(u) order by u.value) from use_rows u where u.count>0),'[]'::jsonb)
  ) into v_result;
  return coalesce(v_result,jsonb_build_object('resultCount',0,'brands','[]'::jsonb,'terms','[]'::jsonb,'attributes','[]'::jsonb,'useProfiles','[]'::jsonb));
end
$function$;

revoke all on function public.public_catalog_facets_v2(text,text,text,text[],text,jsonb) from public;
grant execute on function public.public_catalog_facets_v2(text,text,text,text[],text,jsonb) to anon,authenticated;
