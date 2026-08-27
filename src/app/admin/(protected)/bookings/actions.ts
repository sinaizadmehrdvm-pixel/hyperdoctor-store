"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

const VALID = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export async function updateBookingStatus(id: string, formData: FormData) {
  const status = String(formData.get("status"));
  if (!VALID.includes(status as (typeof VALID)[number])) return;
  await adminRpc<boolean>("admin_update_booking_status", { p_id: id, p_status: status });
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}
