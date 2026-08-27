"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

export async function adjustStock(productId: string, formData: FormData) {
  const delta = Number(formData.get("delta") || 0);
  if (!Number.isInteger(delta) || delta === 0) return;
  const reason = String(formData.get("reason") || "MANUAL");
  const note = String(formData.get("note") || "").trim();
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
