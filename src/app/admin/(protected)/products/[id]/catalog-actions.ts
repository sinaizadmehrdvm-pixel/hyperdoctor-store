"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";

export async function saveProductCatalogLinks(formData:FormData){
  const productId=String(formData.get("productId")||"").trim();
  const brandId=String(formData.get("brandId")||"").trim();
  const secondaryCategoryIds=formData.getAll("secondaryCategoryIds").map(String).map(v=>v.trim()).filter(Boolean);
  const termIds=formData.getAll("termIds").map(String).map(v=>v.trim()).filter(Boolean);
  await adminRpc("admin_set_product_catalog_links",{p_product_id:productId,p_brand_id:brandId||null,p_secondary_categories:secondaryCategoryIds,p_term_ids:termIds});
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/admin/products/${productId}/catalog`);
  revalidatePath("/admin/products");
  revalidatePath("/","layout");
  redirect(`/admin/products/${productId}/catalog?saved=1`);
}
