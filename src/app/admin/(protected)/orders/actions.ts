"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

const VALID_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "FAILED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

export async function updateOrderStatus(orderId: string, formData: FormData) {
  const status = String(formData.get("status"));
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) return;

  await adminRpc<boolean>("admin_update_order_status", {
    p_id: orderId,
    p_status: status,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
