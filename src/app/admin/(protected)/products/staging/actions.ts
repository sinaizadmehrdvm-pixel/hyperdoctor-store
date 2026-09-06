"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import { BWELL_2025_2026_SOURCE, BWELL_2025_2026_STARTER, type VerifiedCatalogMasterItem } from "@/lib/catalog-master-packs/bwell-2025-2026";
import { JTS_MAIN_CATALOG_SOURCE, JTS_MANUAL_WHEELCHAIR_STARTER } from "@/lib/catalog-master-packs/jts-manual-wheelchairs";
import { HOOSHMAND_ORDIBEHESHT_1405_MASTER, HOOSHMAND_ORDIBEHESHT_1405_SOURCE } from "@/lib/catalog-master-packs/hooshmand-ordibehesht-1405";

type Source={id:string};
type Batch={id:string;title?:string;sourceTitle?:string;status?:string};
type BatchItem={id:string;status:string;validation?:{errors?:string[]}};
type BatchDetail={items:BatchItem[]};
type SourcePayload={sourceType:string;title:string;reference?:string;notes?:string;sourceDate?:string|null};
type PackConfig={title:string;pricePolicy:"IGNORE"|"HISTORICAL"|"CURRENT";stockPolicy:"IGNORE"|"CURRENT";priceKind:"OTHER"|"CONSUMER"|"PARTNER"|"PURCHASE"|"SELLING";currency:"IRT"|"IRR"|"TRY"|"USD"|"EUR";notes:string};

const BWELL_TITLE="B.Well 2025-2026 — verified starter master";
const JTS_TITLE="JTS — verified manual wheelchair starter master";
const HOOSHMAND_TITLE="Hooshmand — Ordibehesht 1405 historical consumer price master";

async function createVerifiedPackBatch(sourcePayload:SourcePayload,items:VerifiedCatalogMasterItem[],config:PackConfig){
  const existing=await adminRpc<Batch[]>("admin_catalog_staging_batches");
  const match=existing.find(batch=>batch.title===config.title&&batch.status!=="ARCHIVED");
  if(match?.id)return match.id;
  const source=await adminRpc<Source>("admin_catalog_source_prepare",{p_data:sourcePayload});
  const batch=await adminRpc<Batch>("admin_catalog_staging_create",{p_data:{sourceId:source.id,title:config.title,pricePolicy:config.pricePolicy,stockPolicy:config.stockPolicy,priceKind:config.priceKind,currency:config.currency,notes:config.notes}});
  for(const item of items){await adminRpc("admin_catalog_staging_put_item",{p_batch_id:batch.id,p_item:item});}
  revalidatePath("/admin/products/staging");revalidatePath("/admin/products/sources");
  return batch.id;
}

async function ensureBwell(){return createVerifiedPackBatch(BWELL_2025_2026_SOURCE,BWELL_2025_2026_STARTER,{title:BWELL_TITLE,pricePolicy:"IGNORE",stockPolicy:"IGNORE",priceKind:"OTHER",currency:"IRT",notes:"Source-backed draft staging only. Current Hyper Doctor price, stock, images, warranty, barcode and GTIN remain unset until independently verified."})}
async function ensureJts(){return createVerifiedPackBatch(JTS_MAIN_CATALOG_SOURCE,JTS_MANUAL_WHEELCHAIR_STARTER,{title:JTS_TITLE,pricePolicy:"IGNORE",stockPolicy:"IGNORE",priceKind:"OTHER",currency:"IRT",notes:"Nine distinct source-backed JTS manual wheelchair models. No current price, inventory, warranty, image or official-representation claim is inferred."})}
async function ensureHooshmand(){return createVerifiedPackBatch(HOOSHMAND_ORDIBEHESHT_1405_SOURCE,HOOSHMAND_ORDIBEHESHT_1405_MASTER,{title:HOOSHMAND_TITLE,pricePolicy:"HISTORICAL",stockPolicy:"IGNORE",priceKind:"CONSUMER",currency:"IRR",notes:"All 41 source-listed SKUs are staged as Drafts. Prices are historical consumer observations only; Product current price and stock remain zero after promotion unless a separate current Hyper Doctor source is applied."})}

export async function createStagingBatch(formData:FormData){const sourceId=String(formData.get("sourceId")||"").trim(),title=String(formData.get("title")||"").trim();if(!sourceId||!title)throw new Error("source and title are required");const batch=await adminRpc<Batch>("admin_catalog_staging_create",{p_data:{sourceId,title,pricePolicy:String(formData.get("pricePolicy")||"IGNORE"),stockPolicy:String(formData.get("stockPolicy")||"IGNORE"),priceKind:String(formData.get("priceKind")||"OTHER"),currency:String(formData.get("currency")||"IRT"),notes:String(formData.get("notes")||"").trim()}});revalidatePath("/admin/products/staging");redirect(`/admin/products/staging/${batch.id}`)}
export async function stageVerifiedBwellStarter(){redirect(`/admin/products/staging/${await ensureBwell()}`)}
export async function stageVerifiedJtsWheelchairStarter(){redirect(`/admin/products/staging/${await ensureJts()}`)}
export async function stageHooshmandHistoricalPriceMaster(){redirect(`/admin/products/staging/${await ensureHooshmand()}`)}
export async function stageAllVerifiedLaunchPacks(){await Promise.all([ensureBwell(),ensureJts(),ensureHooshmand()]);revalidatePath("/admin/products/staging");revalidatePath("/admin/products/sources");redirect("/admin/products/staging?verified=ready")}

export async function reviewStagingItem(batchId:string,itemId:string,decision:"APPROVE"|"REJECT"){await adminRpc("admin_catalog_staging_review_item",{p_item_id:itemId,p_decision:decision});revalidatePath(`/admin/products/staging/${batchId}`);revalidatePath("/admin/products/staging")}
export async function reviewStagingBatch(batchId:string,decision:"APPROVE"|"REJECT"){
  const detail=await adminRpc<BatchDetail>("admin_catalog_staging_batch_detail",{p_batch_id:batchId});
  for(const item of detail.items){if(item.status==="PROMOTED")continue;if(decision==="APPROVE"&&(item.validation?.errors?.length||0)>0)continue;if(decision==="APPROVE"&&item.status==="APPROVED")continue;if(decision==="REJECT"&&item.status==="REJECTED")continue;await adminRpc("admin_catalog_staging_review_item",{p_item_id:item.id,p_decision:decision});}
  revalidatePath(`/admin/products/staging/${batchId}`);revalidatePath("/admin/products/staging");
}
export async function promoteStagingItem(batchId:string,itemId:string){await adminRpc("admin_catalog_staging_promote_item",{p_item_id:itemId});revalidatePath(`/admin/products/staging/${batchId}`);revalidatePath("/admin/products/staging");revalidatePath("/admin/products");revalidatePath("/admin/commerce");revalidatePath("/","layout")}
export async function promoteStagingBatch(batchId:string){const detail=await adminRpc<BatchDetail>("admin_catalog_staging_batch_detail",{p_batch_id:batchId});for(const item of detail.items.filter(row=>row.status==="APPROVED")){await adminRpc("admin_catalog_staging_promote_item",{p_item_id:item.id});}revalidatePath(`/admin/products/staging/${batchId}`);revalidatePath("/admin/products/staging");revalidatePath("/admin/products");revalidatePath("/admin/commerce");revalidatePath("/","layout")}
