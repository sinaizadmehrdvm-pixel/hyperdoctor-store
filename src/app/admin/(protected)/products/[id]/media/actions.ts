"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

export async function attachVerifiedProductMedia(productId:string,formData:FormData){
  const mediaId=String(formData.get("mediaId")||"").trim();
  const sourceType=String(formData.get("sourceType")||"").trim();
  const sourceReference=String(formData.get("sourceReference")||"").trim();
  const sourceModel=String(formData.get("sourceModel")||"").trim();
  const notes=String(formData.get("notes")||"").trim();
  if(!mediaId||!sourceReference||!sourceModel) throw new Error("Media, source reference and source model are required");
  await adminRpc("admin_attach_verified_product_media",{p_product_id:productId,p_media_id:mediaId,p_source_type:sourceType,p_source_reference:sourceReference,p_source_model:sourceModel,p_notes:notes});
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/admin/products/${productId}/media`);
  revalidatePath("/admin/products/launch");
}

export async function detachVerifiedProductMedia(productId:string,mediaId:string){
  await adminRpc("admin_detach_verified_product_media",{p_product_id:productId,p_media_id:mediaId});
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/admin/products/${productId}/media`);
  revalidatePath("/admin/products/launch");
}
