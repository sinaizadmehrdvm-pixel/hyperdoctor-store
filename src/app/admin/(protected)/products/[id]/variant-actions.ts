"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

export async function saveVariant(formData:FormData){const productId=String(formData.get("productId")||"").trim();if(!productId)return;const id=String(formData.get("id")||"").trim();await adminRpc("admin_upsert_product_variant",{p_data:{id:id||undefined,productId,name:String(formData.get("name")||"").trim(),sku:String(formData.get("sku")||"").trim(),price:String(formData.get("price")||"").trim(),compareAtPrice:String(formData.get("compareAtPrice")||"").trim(),stock:String(formData.get("stock")||"0").trim(),attributes:String(formData.get("attributes")||"{}").trim(),isPublished:formData.get("isPublished")==="on"}});revalidatePath(`/admin/products/${productId}`);revalidatePath(`/admin/products/${productId}/variants`);}
export async function deleteVariant(formData:FormData){const productId=String(formData.get("productId")||"").trim();const id=String(formData.get("id")||"").trim();if(!id||!productId)return;await adminRpc("admin_delete_product_variant",{p_id:id});revalidatePath(`/admin/products/${productId}`);revalidatePath(`/admin/products/${productId}/variants`);}
