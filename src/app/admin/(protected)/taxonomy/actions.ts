"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

export async function saveTaxonomyTerm(formData:FormData){
  const data={id:String(formData.get("id")||"").trim(),dimension:String(formData.get("dimension")||"").trim(),slug:String(formData.get("slug")||"").trim(),nameFa:String(formData.get("nameFa")||"").trim(),nameTr:String(formData.get("nameTr")||"").trim(),nameEn:String(formData.get("nameEn")||"").trim(),nameAr:String(formData.get("nameAr")||"").trim(),descriptionFa:String(formData.get("descriptionFa")||""),descriptionTr:String(formData.get("descriptionTr")||""),descriptionEn:String(formData.get("descriptionEn")||""),descriptionAr:String(formData.get("descriptionAr")||""),sortOrder:String(formData.get("sortOrder")||"0"),isPublished:formData.get("isPublished")==="on"};
  await adminRpc("admin_upsert_taxonomy_term",{p_data:data});
  revalidatePath("/admin/taxonomy");
  revalidatePath("/admin/products","layout");
}
export async function archiveTaxonomyTerm(formData:FormData){const id=String(formData.get("id")||"").trim();if(id)await adminRpc("admin_archive_taxonomy_term",{p_id:id});revalidatePath("/admin/taxonomy");revalidatePath("/admin/products","layout");}
