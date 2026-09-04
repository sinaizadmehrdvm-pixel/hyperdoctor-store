"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";

function num(v:FormDataEntryValue|null){const s=String(v??"").trim();return s===""?null:Number(s)}
function date(v:FormDataEntryValue|null){const s=String(v??"").trim();return s||null}

export async function updateRentalRequest(formData:FormData){
  const id=String(formData.get("id")||"").trim();
  const status=String(formData.get("status")||"").trim();
  const adminNotes=String(formData.get("adminNotes")||"").trim();
  const rawReturnTo=String(formData.get("returnTo")||"").trim();
  if(!id)return;
  await adminRpc("admin_update_rental_request_v2",{
    p_id:id,p_status:status,p_admin_notes:adminNotes||null,
    p_approved_quantity:num(formData.get("approvedQuantity")),
    p_approved_start_date:date(formData.get("approvedStartDate")),
    p_approved_end_date:date(formData.get("approvedEndDate")),
    p_quoted_amount:num(formData.get("quotedAmount")),
    p_quoted_deposit:num(formData.get("quotedDeposit")),
  });
  revalidatePath("/admin/rentals");
  revalidatePath(`/admin/rentals/${id}`);
  const returnTo=rawReturnTo.startsWith(`/admin/rentals/${id}`)?rawReturnTo:"/admin/rentals";
  redirect(`${returnTo}${returnTo.includes("?")?"&":"?"}saved=1`);
}
