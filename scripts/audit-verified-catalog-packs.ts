import { BWELL_2025_2026_STARTER, type VerifiedCatalogMasterItem } from "@/lib/catalog-master-packs/bwell-2025-2026";
import { JTS_MANUAL_WHEELCHAIR_STARTER } from "@/lib/catalog-master-packs/jts-manual-wheelchairs";
import { HOOSHMAND_ORDIBEHESHT_1405_MASTER } from "@/lib/catalog-master-packs/hooshmand-ordibehesht-1405";

function fail(message:string):never{throw new Error(message)}

const seenSku=new Set<string>();
const seenSlug=new Set<string>();

function common(pack:string,items:VerifiedCatalogMasterItem[]){
  for(const item of items){
    const p=item.payload,sku=String(p.sku||"").trim(),slug=String(p.slug||"").trim();
    if(!sku||!slug)fail(`${pack}: missing SKU/slug at staging row ${item.rowNumber}`);
    if(seenSku.has(sku.toLowerCase()))fail(`Duplicate verified SKU across packs: ${sku}`);
    if(seenSlug.has(slug.toLowerCase()))fail(`Duplicate verified slug across packs: ${slug}`);
    seenSku.add(sku.toLowerCase());seenSlug.add(slug.toLowerCase());
    for(const key of ["nameFa","nameTr","nameEn","nameAr"]){if(!String(p[key]||"").trim())fail(`${sku}: missing ${key}`)}
    if(Number(p.stock||0)!==0)fail(`${sku}: verified source pack must not invent current stock`);
    if(p.isPublished!==false)fail(`${sku}: verified source pack must remain Draft`);
    if(item.images.length!==0)fail(`${sku}: product images must not be fabricated`);
    if(String(p.gtin||"").trim())fail(`${sku}: GTIN must remain unset unless separately validated`);
    if(!String(item.evidence?.verification||"").trim())fail(`${sku}: source evidence verification is missing`);
  }
}

if(BWELL_2025_2026_STARTER.length!==9)fail(`Expected 9 B.Well rows, got ${BWELL_2025_2026_STARTER.length}`);
if(JTS_MANUAL_WHEELCHAIR_STARTER.length!==9)fail(`Expected 9 JTS rows, got ${JTS_MANUAL_WHEELCHAIR_STARTER.length}`);
if(HOOSHMAND_ORDIBEHESHT_1405_MASTER.length!==41)fail(`Expected 41 Hooshmand rows, got ${HOOSHMAND_ORDIBEHESHT_1405_MASTER.length}`);

common("B.Well",BWELL_2025_2026_STARTER);
common("JTS",JTS_MANUAL_WHEELCHAIR_STARTER);
common("Hooshmand",HOOSHMAND_ORDIBEHESHT_1405_MASTER);

for(const item of BWELL_2025_2026_STARTER){
  const p=item.payload,sku=String(p.sku);
  if(String(p.modelNumber||"")!==sku)fail(`${sku}: B.Well model identifier changed`);
  if(Number(p.price||0)!==0)fail(`${sku}: B.Well catalogue pack must not set current price`);
  if(!Number(item.evidence.page)||String(item.evidence.verification)!=="catalog_text")fail(`${sku}: B.Well page evidence is incomplete`);
  const forbidden=[p.barcode,p.gtin,p.warrantyMonths].filter(value=>String(value??"").trim()!=="");
  if(forbidden.length)fail(`${sku}: unsupported B.Well barcode/GTIN/warranty found`);
}

for(const item of JTS_MANUAL_WHEELCHAIR_STARTER){
  const p=item.payload,sku=String(p.sku);
  if(String(p.brand)!=="JTS")fail(`${sku}: JTS brand mismatch`);
  if(!String(p.modelNumber||"").trim())fail(`${sku}: JTS model identifier missing`);
  if(Number(p.price||0)!==0)fail(`${sku}: JTS catalogue pack must not set current price`);
  if(String(p.barcode||"").trim()||String(p.warrantyMonths||"").trim())fail(`${sku}: JTS barcode/warranty must remain unset in catalogue starter`);
  if(String(item.evidence.verification)!=="catalog_master_text")fail(`${sku}: JTS source verification mismatch`);
}

const hooshBarcodes=new Set<string>();
for(const item of HOOSHMAND_ORDIBEHESHT_1405_MASTER){
  const p=item.payload,sku=String(p.sku),barcode=String(p.barcode||"").trim(),price=Number(p.price||0),evidencePrice=Number(item.evidence.consumerPriceIRR||0);
  if(String(p.brand)!=="Hooshmand")fail(`${sku}: Hooshmand brand mismatch`);
  if(!barcode)fail(`${sku}: source barcode missing`);
  if(hooshBarcodes.has(barcode))fail(`${sku}: duplicate Hooshmand source barcode ${barcode}`);
  hooshBarcodes.add(barcode);
  if(price<=0||price!==evidencePrice)fail(`${sku}: historical consumer price must match source evidence`);
  if(String(item.evidence.verification)!=="price_list_text")fail(`${sku}: Hooshmand price-list verification mismatch`);
  if(String(item.evidence.barcodeValidation)!=="pending")fail(`${sku}: source barcode must stay pending GTIN validation`);
  if(String(p.warrantyMonths||"").trim())fail(`${sku}: warranty must not be inferred from price-list-only pack`);
}

const total=BWELL_2025_2026_STARTER.length+JTS_MANUAL_WHEELCHAIR_STARTER.length+HOOSHMAND_ORDIBEHESHT_1405_MASTER.length;
if(total!==59)fail(`Expected 59 verified master rows, got ${total}`);
console.log(`Verified catalog pack audit passed: ${total} rows (9 B.Well + 9 JTS + 41 Hooshmand), no fabricated current inventory or selling price`);
