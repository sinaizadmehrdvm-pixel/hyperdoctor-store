"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

export async function saveBrand(formData: FormData) {
  const id=String(formData.get("id")||"").trim();
  await adminRpc("admin_upsert_brand",{p_data:{id:id||undefined,name:String(formData.get("name")||"").trim(),slug:String(formData.get("slug")||"").trim(),description:String(formData.get("description")||"").trim(),logoUrl:String(formData.get("logoUrl")||"").trim(),websiteUrl:String(formData.get("websiteUrl")||"").trim(),isPublished:formData.get("isPublished")==="on"}});
  revalidatePath("/admin/brands"); revalidatePath("/admin/products");
}
export async function archiveBrand(formData: FormData){const id=String(formData.get("id")||"").trim();if(!id)return;await adminRpc("admin_archive_brand",{p_id:id});revalidatePath("/admin/brands");revalidatePath("/admin/products");}
export async function setProductBrand(formData:FormData){const productId=String(formData.get("productId")||"").trim();const brandId=String(formData.get("brandId")||"").trim();if(!productId)return;await adminRpc("admin_set_product_brand",{p_product_id:productId,p_brand_id:brandId||null});revalidatePath(`/admin/products/${productId}`);revalidatePath("/admin/products");}
