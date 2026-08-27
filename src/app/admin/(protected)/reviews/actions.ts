"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

const VALID = ["PENDING", "APPROVED", "REJECTED"] as const;

export async function updateReview(id: string, formData: FormData) {
  const status = String(formData.get("status"));
  if (!VALID.includes(status as (typeof VALID)[number])) return;
  await adminRpc("admin_update_review", {
    p_id: id,
    p_status: status,
    p_verified: formData.get("isVerified") === "on",
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/", "layout");
}
