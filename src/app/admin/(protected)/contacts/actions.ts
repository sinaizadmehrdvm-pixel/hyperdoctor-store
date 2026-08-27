"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

const VALID = ["NEW", "IN_PROGRESS", "REPLIED", "CLOSED"] as const;

export async function updateContactStatus(id: string, formData: FormData) {
  const status = String(formData.get("status"));
  if (!VALID.includes(status as (typeof VALID)[number])) return;
  await adminRpc("admin_update_contact_message", { p_id: id, p_status: status });
  revalidatePath("/admin/contacts");
  revalidatePath("/admin");
}
