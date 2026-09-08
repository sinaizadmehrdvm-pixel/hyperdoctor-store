"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";

export type SettingsActionState = { status: "idle" | "success" | "error"; error?: string };

export async function updateSiteSettings(_previous: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  try {
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
      businessTimeZone: String(formData.get("businessTimeZone") || "Asia/Tehran").trim(),
    },
  });

  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof Error ? error.message : "";
    const known = ["invalid_contact_email", "invalid_instagram_url", "invalid_telegram_url", "invalid_whatsapp_url", "holding_name_required", "subbrand_name_required", "invalid_default_locale", "invalid_currency", "invalid_business_timezone"];
    const code = known.find((value) => message.includes(value));
    console.error("[admin/settings] save failed", code ?? "unexpected_error");
    return { status: "error", error: code ?? "generic" };
  }
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { status: "success" };
}
