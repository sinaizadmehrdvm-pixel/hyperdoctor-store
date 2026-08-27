"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"] as const;
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export async function updateSupportTicket(id: string, formData: FormData) {
  const status = String(formData.get("status"));
  const priority = String(formData.get("priority"));
  const reply = String(formData.get("reply") || "").trim();
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return;
  if (!PRIORITIES.includes(priority as (typeof PRIORITIES)[number])) return;
  await adminRpc("admin_update_support_ticket", {
    p_id: id,
    p_status: status,
    p_priority: priority,
    p_reply: reply || null,
  });
  revalidatePath("/admin/support");
  revalidatePath("/admin");
}
