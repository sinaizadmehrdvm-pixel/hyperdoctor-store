"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";
import { localDateTimeToISO } from "@/lib/calendar";

function scheduleValue(formData: FormData, name: string) {
  const raw = String(formData.get(name) || "");
  if (!raw) return "";
  const iso = localDateTimeToISO(raw);
  if (!iso) throw new Error(`Invalid ${name} date/time`);
  return iso;
}

export async function upsertCoupon(formData: FormData) {
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const type = String(formData.get("type") || "PERCENT");
  const value = Number(formData.get("value") || 0);
  if (!code || !["PERCENT", "FIXED"].includes(type) || !Number.isFinite(value) || value < 0) return;

  const startsAt = scheduleValue(formData, "startsAt");
  const expiresAt = scheduleValue(formData, "expiresAt");
  if (startsAt && expiresAt && new Date(expiresAt).getTime() <= new Date(startsAt).getTime()) {
    throw new Error("Discount expiry time must be after start time");
  }

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
      startsAt,
      expiresAt,
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/discounts");
}
