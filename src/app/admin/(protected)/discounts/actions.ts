"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

export async function upsertCoupon(formData: FormData) {
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const type = String(formData.get("type") || "PERCENT");
  const value = Number(formData.get("value") || 0);
  if (!code || !["PERCENT", "FIXED"].includes(type) || !Number.isFinite(value) || value < 0) return;
  await adminRpc("admin_upsert_coupon", {
    p_data: {
      id: String(formData.get("id") || ""),
      code,
      type,
      value: Math.trunc(value),
      minOrderAmount: String(formData.get("minOrderAmount") || ""),
      maxDiscount: String(formData.get("maxDiscount") || ""),
      usageLimit: String(formData.get("usageLimit") || ""),
      usageLimitPerUser: String(formData.get("usageLimitPerUser") || ""),
      startsAt: String(formData.get("startsAt") || ""),
      expiresAt: String(formData.get("expiresAt") || ""),
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/discounts");
}
