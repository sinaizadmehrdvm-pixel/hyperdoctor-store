"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";

export async function saveProductRelationsAndFlags(formData:FormData){
  const productId=String(formData.get("productId")||"").trim();
  if(!productId)throw new Error("Product id is required");
  const rows:Array<{relatedProductId:string;relationType:string;sortOrder:number}>=[];
  const groups:[string,string][]=[["alternativeIds","ALTERNATIVE"],["upgradeIds","UPGRADE"],["accessoryIds","ACCESSORY"]];
  for(const[name,type]of groups){formData.getAll(name).map(String).map(v=>v.trim()).filter(Boolean).slice(0,100).forEach((id,index)=>rows.push({relatedProductId:id,relationType:type,sortOrder:index}));}
  await adminRpc("admin_set_product_relations_and_flags",{
    p_product_id:productId,
    p_rental_eligible:formData.get("rentalEligible")==="on",
    p_professional_use:formData.get("professionalUse")==="on",
    p_home_use:formData.get("homeUse")==="on",
    p_relations:rows,
  });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/admin/products/${productId}/relations`);
  revalidatePath("/","layout");
  redirect(`/admin/products/${productId}/relations?saved=1`);
}
