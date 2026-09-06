"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

export async function publishReadyProducts(formData:FormData){const branchId=String(formData.get("branchId")||"").trim();if(!branchId)throw new Error("branch is required");await adminRpc("admin_publish_catalog_ready_products",{p_branch_id:branchId,p_product_ids:null});revalidatePath("/admin/products/launch");revalidatePath("/admin/products");revalidatePath("/admin/commerce");revalidatePath("/","layout");}
