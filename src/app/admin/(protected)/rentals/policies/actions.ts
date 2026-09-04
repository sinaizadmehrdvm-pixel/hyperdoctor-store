"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";
const n=(v:FormDataEntryValue|null)=>{const s=String(v??"").trim();return s===""?null:Number(s)};
export async function saveRentalPolicy(formData:FormData){const productId=String(formData.get("productId")||"");if(!productId)return;await adminRpc("admin_rental_policy_upsert",{p_product_id:productId,p_available_units:Number(formData.get("availableUnits")||0),p_daily_rate:n(formData.get("dailyRate")),p_weekly_rate:n(formData.get("weeklyRate")),p_monthly_rate:n(formData.get("monthlyRate")),p_deposit_amount:n(formData.get("depositAmount")),p_currency:String(formData.get("currency")||"IRR").trim().toUpperCase(),p_min_days:Number(formData.get("minDays")||1),p_max_days:n(formData.get("maxDays")),p_is_active:formData.get("isActive")==="on"});revalidatePath("/admin/rentals/policies");redirect("/admin/rentals/policies?saved=1")}
