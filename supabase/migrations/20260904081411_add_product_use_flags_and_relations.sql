alter table public."Product"
  add column if not exists "rentalEligible" boolean not null default false,
  add column if not exists "professionalUse" boolean not null default false,
  add column if not exists "homeUse" boolean not null default true;

create table if not exists public."ProductRelation" (
  "productId" text not null references public."Product"(id) on delete cascade,
  "relatedProductId" text not null references public."Product"(id) on delete cascade,
  "relationType" text not null check ("relationType" in ('ALTERNATIVE','UPGRADE','ACCESSORY')),
  "sortOrder" integer not null default 0,
  "createdAt" timestamp without time zone not null default now(),
  primary key ("productId","relatedProductId","relationType"),
  check ("productId" <> "relatedProductId")
);

create index if not exists "ProductRelation_product_type_idx"
  on public."ProductRelation"("productId","relationType","sortOrder");

alter table public."ProductRelation" enable row level security;
grant select on public."ProductRelation" to anon, authenticated;
revoke insert, update, delete on public."ProductRelation" from anon, authenticated;

drop policy if exists "public published product relations" on public."ProductRelation";
create policy "public published product relations"
  on public."ProductRelation"
  for select to anon, authenticated
  using (
    exists(select 1 from public."Product" p where p.id="productId" and p."isPublished"=true)
    and exists(select 1 from public."Product" r where r.id="relatedProductId" and r."isPublished"=true)
  );

create or replace function public.admin_product_relations_bundle(p_token text,p_product_id text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_admin public."AdminUser"%rowtype;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  if not exists(select 1 from public."Product" where id=p_product_id) then raise exception 'product_not_found'; end if;
  return jsonb_build_object(
    'flags',(select jsonb_build_object('rentalEligible',"rentalEligible",'professionalUse',"professionalUse",'homeUse',"homeUse") from public."Product" where id=p_product_id),
    'relations',(select coalesce(jsonb_agg(jsonb_build_object('relatedProductId',"relatedProductId",'relationType',"relationType",'sortOrder',"sortOrder") order by "relationType","sortOrder"),'[]'::jsonb) from public."ProductRelation" where "productId"=p_product_id),
    'products',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'sku',sku,'nameFa',"nameFa",'nameTr',"nameTr",'nameEn',"nameEn",'nameAr',"nameAr") order by "nameEn",sku),'[]'::jsonb) from public."Product" where id<>p_product_id and "isPublished"=true)
  );
end $$;

revoke all on function public.admin_product_relations_bundle(text,text) from public;
grant execute on function public.admin_product_relations_bundle(text,text) to anon, authenticated;

create or replace function public.admin_set_product_relations_and_flags(
  p_token text,
  p_product_id text,
  p_rental_eligible boolean,
  p_professional_use boolean,
  p_home_use boolean,
  p_relations jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_admin public."AdminUser"%rowtype;
  v_item jsonb;
  v_related text;
  v_type text;
  v_sort int;
begin
  v_admin:=public._admin_session_user(p_token);
  if v_admin.role not in ('SUPER_ADMIN'::"AdminRole",'EDITOR'::"AdminRole") then raise exception 'forbidden'; end if;
  if not exists(select 1 from public."Product" where id=p_product_id) then raise exception 'product_not_found'; end if;

  update public."Product"
  set "rentalEligible"=coalesce(p_rental_eligible,false),
      "professionalUse"=coalesce(p_professional_use,false),
      "homeUse"=coalesce(p_home_use,false),
      "updatedAt"=now()
  where id=p_product_id;

  delete from public."ProductRelation" where "productId"=p_product_id;

  for v_item in select value from jsonb_array_elements(coalesce(p_relations,'[]'::jsonb)) loop
    v_related:=nullif(trim(v_item->>'relatedProductId'),'');
    v_type:=upper(nullif(trim(v_item->>'relationType'),''));
    v_sort:=coalesce((v_item->>'sortOrder')::int,0);
    if v_related is null or v_related=p_product_id or v_type not in ('ALTERNATIVE','UPGRADE','ACCESSORY') then continue; end if;
    if not exists(select 1 from public."Product" where id=v_related) then continue; end if;
    insert into public."ProductRelation"("productId","relatedProductId","relationType","sortOrder")
      values(p_product_id,v_related,v_type,v_sort)
    on conflict ("productId","relatedProductId","relationType") do update set "sortOrder"=excluded."sortOrder";
  end loop;

  return jsonb_build_object('ok',true);
end $$;

revoke all on function public.admin_set_product_relations_and_flags(text,text,boolean,boolean,boolean,jsonb) from public;
grant execute on function public.admin_set_product_relations_and_flags(text,text,boolean,boolean,boolean,jsonb) to anon, authenticated;
