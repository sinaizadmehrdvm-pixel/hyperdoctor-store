"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

const VALID_REASONS = new Set(["PURCHASE", "SALE_ADJUSTMENT", "RETURN", "DAMAGED", "MANUAL"]);
const MAX_ABS_ADJUSTMENT = 1_000_000;

export async function adjustStock(productId: string, formData: FormData) {
  const delta = Number(formData.get("delta") || 0);
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > MAX_ABS_ADJUSTMENT) return;

  const submittedReason = String(formData.get("reason") || "MANUAL");
  const reason = VALID_REASONS.has(submittedReason) ? submittedReason : "MANUAL";
  const note = String(formData.get("note") || "").trim().slice(0, 500);

  await adminRpc("admin_adjust_stock", {
    p_product_id: productId,
    p_delta: delta,
    p_reason: reason,
    p_note: note,
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}
