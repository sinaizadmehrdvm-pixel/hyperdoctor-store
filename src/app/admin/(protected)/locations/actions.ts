"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";

const s=(f:FormData,k:string)=>String(f.get(k)||"").trim();
const n=(f:FormData,k:string)=>Math.max(0,Number(f.get(k)||0)||0);
export async function saveBranch(formData:FormData){const id=s(formData,"id");await adminRpc("admin_upsert_branch",{p_id:id||null,p_code:s(formData,"code"),p_name_fa:s(formData,"nameFa"),p_name_tr:s(formData,"nameTr"),p_name_en:s(formData,"nameEn"),p_name_ar:s(formData,"nameAr"),p_country_code:s(formData,"countryCode")||"IR",p_currency:s(formData,"currency")||"IRT",p_timezone:s(formData,"timezone")||"Asia/Tehran",p_is_default:formData.get("isDefault")==="on",p_is_published:formData.get("isPublished")==="on"});revalidatePath("/admin/locations");redirect("/admin/locations?saved=branch")}
export async function saveWarehouse(formData:FormData){const id=s(formData,"id");await adminRpc("admin_upsert_warehouse",{p_id:id||null,p_branch_id:s(formData,"branchId"),p_code:s(formData,"code"),p_name_fa:s(formData,"nameFa"),p_name_tr:s(formData,"nameTr"),p_name_en:s(formData,"nameEn"),p_name_ar:s(formData,"nameAr"),p_is_active:formData.get("isActive")==="on"});revalidatePath("/admin/locations");redirect("/admin/locations?saved=warehouse")}
export async function saveWarehouseInventory(formData:FormData){const warehouseId=s(formData,"warehouseId"),productId=s(formData,"productId");if(!warehouseId||!productId)return;await adminRpc("admin_set_warehouse_inventory",{p_warehouse_id:warehouseId,p_product_id:productId,p_on_hand:n(formData,"onHand"),p_reserved:n(formData,"reserved"),p_rental_units:n(formData,"rentalUnits")});revalidatePath("/admin/locations");redirect(`/admin/locations?warehouse=${encodeURIComponent(warehouseId)}&saved=inventory`)}
export async function saveWarehouseVariantInventory(formData:FormData){const warehouseId=s(formData,"warehouseId"),variantId=s(formData,"variantId"),q=s(formData,"q");if(!warehouseId||!variantId)return;await adminRpc("admin_set_warehouse_variant_inventory",{p_warehouse_id:warehouseId,p_variant_id:variantId,p_on_hand:n(formData,"onHand"),p_reserved:n(formData,"reserved")});revalidatePath("/admin/locations/variants");const params=new URLSearchParams({warehouse:warehouseId,saved:"1"});if(q)params.set("q",q);redirect(`/admin/locations/variants?${params.toString()}`)}
