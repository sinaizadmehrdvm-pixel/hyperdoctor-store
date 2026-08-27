"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import { slugify } from "@/lib/slug";

export async function upsertCategory(formData: FormData) {
  const nameFa = String(formData.get("nameFa") || "").trim();
  const nameEn = String(formData.get("nameEn") || "").trim();
  const slug = slugify(String(formData.get("slug") || nameEn || nameFa));
  if (!nameFa || !nameEn || !slug) throw new Error("نام فارسی، نام انگلیسی و آدرس دسته‌بندی الزامی است.");

  await adminRpc("admin_upsert_category", {
    p_data: {
      id: String(formData.get("id") || ""),
      vertical: String(formData.get("vertical") || "MEDICAL_EQUIPMENT"),
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
      order: Number(formData.get("order") || 0),
      isPublished: formData.get("isPublished") === "on",
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  const result = await adminRpc<{ ok: boolean; reason?: string | null; productCount?: number }>("admin_delete_category", { p_id: id });
  if (!result.ok && result.reason === "HAS_PRODUCTS") {
    throw new Error(`این دسته‌بندی ${result.productCount ?? 0} محصول دارد و تا انتقال محصولات قابل حذف نیست.`);
  }
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}
