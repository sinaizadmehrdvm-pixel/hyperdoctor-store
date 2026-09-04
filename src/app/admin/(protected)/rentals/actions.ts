"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";

export async function updateRentalRequest(formData:FormData){
  const id=String(formData.get("id")||"").trim();
  const status=String(formData.get("status")||"").trim();
  const adminNotes=String(formData.get("adminNotes")||"").trim();
  const rawReturnTo=String(formData.get("returnTo")||"").trim();
  if(!id)return;
  await adminRpc("admin_update_rental_request",{p_id:id,p_status:status,p_admin_notes:adminNotes||null});
  revalidatePath("/admin/rentals");
  revalidatePath(`/admin/rentals/${id}`);
  const returnTo=rawReturnTo.startsWith(`/admin/rentals/${id}`)?rawReturnTo:"/admin/rentals";
  redirect(`${returnTo}${returnTo.includes("?")?"&":"?"}saved=1`);
}
