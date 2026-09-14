create or replace function public.public_catalog_v286(p_slug text default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with eligible as (
  select p.id
  from public."Product" p
  where (p_slug is null or p.slug = p_slug)
    and exists (
      select 1
      from public."ProductMediaEvidence" e
      join public."ProductMediaBlob" b on b."mediaId" = e."mediaId"
      where e."productId" = p.id
        and e."verificationStatus" = 'VERIFIED'
        and e."mediaId" like 'media-v285-%'
        and b."mimeType" = 'image/webp'
        and b."byteSize" > 0
        and char_length(b.sha256) = 64
    )
), rows as (
  select
    to_jsonb(p)
    || jsonb_build_object(
      'images', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id',m.id,
          'url',m.url,
          'altFa',m."altFa",
          'altTr',m."altTr",
          'altEn',m."altEn",
          'altAr',m."altAr",
          'width',m.width,
          'height',m.height,
          'sortOrder',m."sortOrder"
        ) order by m."sortOrder",m."createdAt")
        from public."Media" m
        join public."ProductMediaEvidence" e on e."mediaId"=m.id and e."productId"=p.id and e."verificationStatus"='VERIFIED'
        join public."ProductMediaBlob" mb on mb."mediaId"=m.id
        where m."productId"=p.id
          and m.id like 'media-v285-%'
          and mb."mimeType"='image/webp'
          and mb."byteSize">0
          and char_length(mb.sha256)=64
      ), '[]'::jsonb),
      'category', case when c.id is null then null else jsonb_build_object(
        'id',c.id,'slug',c.slug,'nameFa',c."nameFa",'nameTr',c."nameTr",'nameEn',c."nameEn",'nameAr',c."nameAr",'order',c."order"
      ) end,
      'brandEntity', case when br.id is null then null else jsonb_build_object('id',br.id,'name',br.name,'slug',br.slug) end,
      'catalogVerified', true,
      'commerceReady', (p."isPublished" = true and coalesce(p.price,0) > 0)
    ) as item
  from public."Product" p
  join eligible v on v.id=p.id
  left join public."Category" c on c.id=p."categoryId" and c."isPublished"=true
  left join public."Brand" br on br.id=p."brandId"
)
select coalesce(jsonb_agg(item order by (item->>'createdAt') desc), '[]'::jsonb) from rows;
$$;

revoke all on function public.public_catalog_v286(text) from public;
grant execute on function public.public_catalog_v286(text) to anon, authenticated, service_role;
