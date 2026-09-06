import { BWELL_2025_2026_STARTER } from "@/lib/catalog-master-packs/bwell-2025-2026";

function fail(message:string):never{throw new Error(message)}

const seenSku=new Set<string>();
const seenSlug=new Set<string>();

if(BWELL_2025_2026_STARTER.length!==9)fail(`Expected 9 verified B.Well starter rows, got ${BWELL_2025_2026_STARTER.length}`);

for(const item of BWELL_2025_2026_STARTER){
  const p=item.payload;
  const sku=String(p.sku||"").trim();
  const slug=String(p.slug||"").trim();
  if(!sku||!slug)fail(`Missing SKU/slug at staging row ${item.rowNumber}`);
  if(seenSku.has(sku.toLowerCase()))fail(`Duplicate verified SKU: ${sku}`);
  if(seenSlug.has(slug.toLowerCase()))fail(`Duplicate verified slug: ${slug}`);
  seenSku.add(sku.toLowerCase());seenSlug.add(slug.toLowerCase());
  for(const key of ["nameFa","nameTr","nameEn","nameAr"]){if(!String(p[key]||"").trim())fail(`${sku}: missing ${key}`)}
  if(String(p.modelNumber||"")!==sku)fail(`${sku}: modelNumber must preserve the source model identifier`);
  if(Number(p.price||0)!==0)fail(`${sku}: verified catalogue pack must not invent current price`);
  if(Number(p.stock||0)!==0)fail(`${sku}: verified catalogue pack must not invent current stock`);
  if(p.isPublished!==false)fail(`${sku}: verified catalogue pack must remain Draft`);
  if(item.images.length!==0)fail(`${sku}: product images must not be fabricated`);
  if(!Number(item.evidence.page)||String(item.evidence.verification)!=="catalog_text")fail(`${sku}: source evidence is incomplete`);
  const forbidden=[p.barcode,p.gtin,p.warrantyMonths].filter(value=>String(value??"").trim()!=="");
  if(forbidden.length)fail(`${sku}: unsupported barcode/GTIN/warranty data found`);
}

console.log(`Verified catalog pack audit passed: ${BWELL_2025_2026_STARTER.length} B.Well rows, no fabricated current commerce data`);
