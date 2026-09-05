"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";

function num(v:FormDataEntryValue|null){const s=String(v??"").trim();return s===""?null:Number(s)}
function date(v:FormDataEntryValue|null){const s=String(v??"").trim();return s||null}
function text(v:FormDataEntryValue|null,max=4000){const s=String(v??"").trim();return s?s.slice(0,max):null}
function lifecycleReturn(id:string,kind:string){revalidatePath("/admin/rentals");revalidatePath(`/admin/rentals/${id}`);revalidatePath(`/admin/rentals/${id}/lifecycle`);revalidatePath(`/admin/rentals/${id}/contract`);revalidatePath(`/admin/rentals/${id}/return-report`);redirect(`/admin/rentals/${id}/lifecycle?saved=${encodeURIComponent(kind)}`)}

export async function updateRentalRequest(formData:FormData){
  const id=String(formData.get("id")||"").trim();
  const status=String(formData.get("status")||"").trim();
  const adminNotes=String(formData.get("adminNotes")||"").trim();
  const rawReturnTo=String(formData.get("returnTo")||"").trim();
  if(!id)return;
  await adminRpc("admin_update_rental_request_v3",{
    p_id:id,p_status:status,p_admin_notes:adminNotes||null,
    p_approved_quantity:num(formData.get("approvedQuantity")),
    p_approved_start_date:date(formData.get("approvedStartDate")),
    p_approved_end_date:date(formData.get("approvedEndDate")),
    p_quoted_amount:num(formData.get("quotedAmount")),
    p_quoted_deposit:num(formData.get("quotedDeposit")),
    p_approved_warehouse_id:String(formData.get("approvedWarehouseId")||"").trim()||null,
  });
  revalidatePath("/admin/rentals");
  revalidatePath(`/admin/rentals/${id}`);
  const returnTo=rawReturnTo.startsWith(`/admin/rentals/${id}`)?rawReturnTo:"/admin/rentals";
  redirect(`${returnTo}${returnTo.includes("?")?"&":"?"}saved=1`);
}

export async function recordRentalHandover(formData:FormData){
  const id=String(formData.get("id")||"").trim();if(!id)return;
  await adminRpc("admin_rental_record_handover",{p_rental_request_id:id,p_device_serials:text(formData.get("deviceSerials"),2000),p_handover_by:text(formData.get("handoverBy"),240),p_handover_condition:text(formData.get("handoverCondition")),p_handover_accessories:text(formData.get("handoverAccessories")),p_handover_notes:text(formData.get("handoverNotes")),p_deposit_received:num(formData.get("depositReceived"))??0,p_handover_at:date(formData.get("handoverAt"))});
  lifecycleReturn(id,"handover");
}

export async function recordRentalReturn(formData:FormData){
  const id=String(formData.get("id")||"").trim();if(!id)return;
  await adminRpc("admin_rental_record_return",{p_rental_request_id:id,p_returned_by:text(formData.get("returnedBy"),240),p_return_condition:text(formData.get("returnCondition")),p_return_accessories:text(formData.get("returnAccessories")),p_damage_notes:text(formData.get("damageNotes")),p_missing_items:text(formData.get("missingItems")),p_returned_at:date(formData.get("returnedAt"))});
  lifecycleReturn(id,"return");
}

export async function settleRental(formData:FormData){
  const id=String(formData.get("id")||"").trim();if(!id)return;
  await adminRpc("admin_rental_settlement",{p_rental_request_id:id,p_final_rental_charge:num(formData.get("finalRentalCharge")),p_damage_charge:num(formData.get("damageCharge"))??0,p_other_charge:num(formData.get("otherCharge"))??0,p_deposit_refunded:num(formData.get("depositRefunded"))??0,p_additional_payment_received:num(formData.get("additionalPaymentReceived"))??0,p_settlement_reference:text(formData.get("settlementReference"),500),p_settled_at:date(formData.get("settledAt"))});
  lifecycleReturn(id,"settlement");
}
