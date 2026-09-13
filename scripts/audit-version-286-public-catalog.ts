import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(`[v286] ${message}`)}
function includesAll(text:string,needles:string[],label:string){for(const needle of needles)assert(text.includes(needle),`${label} missing required invariant: ${needle}`)}

const schemaMigration=read("supabase/migrations/20260914002500_version_286_public_catalog_visibility.sql");
const activationMigration=read("supabase/migrations/20260914002600_version_286_activate_verified_catalog.sql");
const queries=read("src/lib/queries.ts");
const card=read("src/components/site/shop-product-card.tsx");
const detail=read("src/app/[locale]/product/[slug]/page.tsx");
const compare=read("src/components/site/compare-client.tsx");

includesAll(schemaMigration,[
  'add column if not exists "catalogVisible" boolean not null default false',
  '"isPublished" = true or "catalogVisible" = true',
  'create policy "public_read_catalog_products"',
  'create policy "public_read_catalog_brands"',
  'create policy "public_read_product_media"',
  'create policy "public_read_secondary_categories"',
  'create policy "public_read_product_taxonomy"',
  'create policy "public_read_attribute_values"',
  'create policy "public catalog product relations"',
  'create or replace function public.public_seo_index_v1()',
  '(p."isPublished"=true or p."catalogVisible"=true)',
],"schema migration");
assert(!schemaMigration.includes('set "catalogVisible" = true'),"schema migration must remain non-activating for zero-downtime rollout");

includesAll(activationMigration,[
  'v_products <> 117',
  '"verificationStatus" = \'VERIFIED\'',
  'b.sha256 = encode(digest(b.bytes, \'sha256\'), \'hex\')',
  'set "catalogVisible" = true',
  'v_visible <> 117 or v_media_visible <> 117',
  'catalog-only product crossed the commerce gate',
],"activation migration");

includesAll(queries,[
  'const PUBLIC_CATALOG_OR = "(isPublished.eq.true,catalogVisible.eq.true)"',
  'function publicCatalogParams',
  'commerceReady:product.isPublished===true',
  'catalogOnly:product.catalogVisible===true&&product.isPublished!==true',
  'supabaseSelect<any>("Product",publicCatalogParams({select:"*"}))',
  'product.isPublished===true?supabaseSelect<any>("ProductVariant"',
  'SAFE_ENTITY_ID.test(brand)',
],"queries");

assert(!queries.includes('supabaseSelect<any>("Product",{select:"*",isPublished:"eq.true"})'),"legacy Product publication-only query remains");
assert(!queries.includes('slug:`eq.${slug}`,isPublished:"eq.true"'),"product detail still publication-only");

includesAll(card,[
  'commerceReady=product.commerceReady??product.isPublished===true',
  'catalogOnly=product.catalogOnly??(product.catalogVisible===true&&!commerceReady)',
  'قیمت و موجودی پس از استعلام',
  'Details & inquiry',
],"product card");

includesAll(detail,[
  'commerceReady=product.isPublished===true',
  'catalogOnly=product.catalogVisible===true&&!commerceReady',
  'فروش غیرفعال تا ثبت داده تجاری معتبر',
  'This product is source-backed catalog content',
],"product detail");

includesAll(compare,[
  'function isCommerceReady',
  'inquiryValue(locale)',
  'Price status',
  'Price on request',
],"comparison");

console.log("[v286] public catalog visibility audit passed");
