"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

const VALID = ["ACTIVE", "EXPIRED", "SUSPENDED", "REPLACED"] as const;

export async function updateWarranty(id: string, formData: FormData) {
  const status = String(formData.get("status"));
  const notes = String(formData.get("notes") || "");
  if (!VALID.includes(status as (typeof VALID)[number])) return;
  await adminRpc("admin_update_warranty", { p_id: id, p_status: status, p_notes: notes });
  revalidatePath("/admin/warranties");
  revalidatePath("/admin");
}
