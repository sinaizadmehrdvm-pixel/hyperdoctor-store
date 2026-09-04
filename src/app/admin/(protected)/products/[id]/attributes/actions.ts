"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";

export async function saveProductAttributes(formData:FormData){const productId=String(formData.get("productId")||"").trim();if(!productId)throw new Error("Product id required");const values:Array<{definitionId:string;value:string}>=[];for(const[k,v]of formData.entries()){if(!k.startsWith("attr_"))continue;const definitionId=k.slice(5),value=String(v).trim();if(definitionId&&value)values.push({definitionId,value});}await adminRpc("admin_set_product_attributes",{p_product_id:productId,p_values:values});revalidatePath(`/admin/products/${productId}/attributes`);revalidatePath(`/admin/products/${productId}`);revalidatePath("/","layout");redirect(`/admin/products/${productId}/attributes?saved=1`);}
