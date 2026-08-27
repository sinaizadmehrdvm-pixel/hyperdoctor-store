"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

export async function updateSiteSettings(formData: FormData) {
  await adminRpc("admin_update_site_settings", {
    p_data: {
      holdingName: String(formData.get("holdingName") || "").trim(),
      holdingLogoUrl: String(formData.get("holdingLogoUrl") || "").trim(),
      subBrandName: String(formData.get("subBrandName") || "").trim(),
      subBrandLogoUrl: String(formData.get("subBrandLogoUrl") || "").trim(),
      contactPhone: String(formData.get("contactPhone") || "").trim(),
      contactEmail: String(formData.get("contactEmail") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      instagramUrl: String(formData.get("instagramUrl") || "").trim(),
      telegramUrl: String(formData.get("telegramUrl") || "").trim(),
      whatsappUrl: String(formData.get("whatsappUrl") || "").trim(),
      defaultLocale: String(formData.get("defaultLocale") || "fa"),
      supportedLocales: "fa,tr,en,ar",
      currency: String(formData.get("currency") || "IRT"),
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
