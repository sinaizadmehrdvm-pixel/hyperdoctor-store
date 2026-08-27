"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import { slugify } from "@/lib/slug";

export async function upsertService(formData: FormData) {
  const nameFa = String(formData.get("nameFa") || "").trim();
  const nameEn = String(formData.get("nameEn") || "").trim();
  const slug = slugify(String(formData.get("slug") || nameEn || nameFa));
  if (!nameFa || !nameEn || !slug) throw new Error("نام فارسی، نام انگلیسی و اسلاگ خدمت الزامی است.");

  const priceValue = String(formData.get("price") || "").trim();
  const durationValue = String(formData.get("durationMinutes") || "").trim();

  await adminRpc("admin_upsert_service", {
    p_data: {
      id: String(formData.get("id") || ""),
      vertical: String(formData.get("vertical") || "RESPIRATORY_SERVICES"),
      slug,
      nameFa,
      nameTr: String(formData.get("nameTr") || "").trim(),
      nameEn,
      nameAr: String(formData.get("nameAr") || "").trim(),
      descriptionFa: String(formData.get("descriptionFa") || ""),
      descriptionTr: String(formData.get("descriptionTr") || ""),
      descriptionEn: String(formData.get("descriptionEn") || ""),
      descriptionAr: String(formData.get("descriptionAr") || ""),
      image: String(formData.get("image") || ""),
      price: priceValue,
      priceIsFrom: formData.get("priceIsFrom") === "on",
      durationMinutes: durationValue,
      requiresBooking: formData.get("requiresBooking") === "on",
      isPublished: formData.get("isPublished") === "on",
    },
  });

  revalidatePath("/admin/services");
  revalidatePath("/services", "layout");
  revalidatePath("/", "layout");
  redirect("/admin/services");
}

export async function deleteService(id: string) {
  await adminRpc<boolean>("admin_archive_service", { p_id: id });
  revalidatePath("/admin/services");
  revalidatePath("/services", "layout");
  revalidatePath("/", "layout");
}
