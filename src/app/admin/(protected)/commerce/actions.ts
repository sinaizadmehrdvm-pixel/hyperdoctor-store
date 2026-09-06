"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

function int(value:FormDataEntryValue|null,min=0,max=2_000_000_000){const n=Number(value);if(!Number.isInteger(n)||n<min||n>max)throw new Error("invalid numeric value");return n}
function optInt(value:FormDataEntryValue|null){const s=String(value??"").trim();if(!s)return null;return int(s,0)}
function clean(value:FormDataEntryValue|null,max=180){return String(value??"").trim().slice(0,max)}

export async function saveBranchPrice(formData:FormData){
  const branchId=clean(formData.get("branchId")),productId=clean(formData.get("productId"));
  if(!branchId||!productId)throw new Error("missing ids");
  const price=int(formData.get("price"),1),compareAtPrice=optInt(formData.get("compareAtPrice"));
  if(compareAtPrice!==null&&compareAtPrice<price)throw new Error("compare price must be >= price");
  await adminRpc<boolean>("admin_upsert_branch_product_price",{p_branch_id:branchId,p_product_id:productId,p_price:price,p_compare_at_price:compareAtPrice,p_is_active:true});
  revalidatePath("/admin/commerce");revalidatePath("/admin/products");revalidatePath("/","layout");
}

export async function saveWarehouseStock(formData:FormData){
  const warehouseId=clean(formData.get("warehouseId")),productId=clean(formData.get("productId"));
  if(!warehouseId||!productId)throw new Error("missing ids");
  const onHand=int(formData.get("onHand")),reserved=int(formData.get("reserved"));
  if(reserved>onHand)throw new Error("reserved exceeds on-hand");
  await adminRpc<boolean>("admin_set_warehouse_inventory",{p_warehouse_id:warehouseId,p_product_id:productId,p_on_hand:onHand,p_reserved:reserved,p_rental_units:0});
  revalidatePath("/admin/commerce");revalidatePath("/admin/inventory");revalidatePath("/admin/products");revalidatePath("/","layout");
}
