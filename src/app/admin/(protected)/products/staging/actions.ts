"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import { BWELL_2025_2026_SOURCE, BWELL_2025_2026_STARTER } from "@/lib/catalog-master-packs/bwell-2025-2026";

type Source={id:string};
type Batch={id:string};

export async function createStagingBatch(formData:FormData){
  const sourceId=String(formData.get("sourceId")||"").trim();
  const title=String(formData.get("title")||"").trim();
  if(!sourceId||!title)throw new Error("source and title are required");
  const batch=await adminRpc<Batch>("admin_catalog_staging_create",{p_data:{
    sourceId,title,
    pricePolicy:String(formData.get("pricePolicy")||"IGNORE"),
    stockPolicy:String(formData.get("stockPolicy")||"IGNORE"),
    priceKind:String(formData.get("priceKind")||"OTHER"),
    currency:String(formData.get("currency")||"IRT"),
    notes:String(formData.get("notes")||"").trim(),
  }});
  revalidatePath("/admin/products/staging");
  redirect(`/admin/products/staging/${batch.id}`);
}

export async function stageVerifiedBwellStarter(){
  const source=await adminRpc<Source>("admin_catalog_source_prepare",{p_data:BWELL_2025_2026_SOURCE});
  const batch=await adminRpc<Batch>("admin_catalog_staging_create",{p_data:{
    sourceId:source.id,
    title:"B.Well 2025-2026 — verified starter master",
    pricePolicy:"IGNORE",
    stockPolicy:"IGNORE",
    priceKind:"OTHER",
    currency:"IRT",
    notes:"Source-backed draft staging only. Current Hyper Doctor price, stock, images, warranty, barcode and GTIN remain unset until independently verified.",
  }});
  for(const item of BWELL_2025_2026_STARTER){
    await adminRpc("admin_catalog_staging_put_item",{p_batch_id:batch.id,p_item:item});
  }
  revalidatePath("/admin/products/staging");
  revalidatePath("/admin/products/sources");
  redirect(`/admin/products/staging/${batch.id}`);
}

export async function reviewStagingItem(batchId:string,itemId:string,decision:"APPROVE"|"REJECT"){
  await adminRpc("admin_catalog_staging_review_item",{p_item_id:itemId,p_decision:decision});
  revalidatePath(`/admin/products/staging/${batchId}`);
  revalidatePath("/admin/products/staging");
}

export async function promoteStagingItem(batchId:string,itemId:string){
  await adminRpc("admin_catalog_staging_promote_item",{p_item_id:itemId});
  revalidatePath(`/admin/products/staging/${batchId}`);
  revalidatePath("/admin/products/staging");
  revalidatePath("/admin/products");
  revalidatePath("/","layout");
}
