"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

export async function updateCustomer(id: string, formData: FormData) {
  await adminRpc("admin_update_customer", {
    p_id: id,
    p_active: formData.get("isActive") === "on",
    p_marketing: formData.get("marketingConsent") === "on",
  });
  revalidatePath("/admin/customers");
  revalidatePath("/admin");
}
