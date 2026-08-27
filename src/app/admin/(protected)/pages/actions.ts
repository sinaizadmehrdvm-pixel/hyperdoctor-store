"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import { RESERVED_SLUGS, slugify } from "@/lib/slug";

export async function upsertPage(formData: FormData) {
  const id = String(formData.get("id") || "");
  const slug = slugify(String(formData.get("slug") || formData.get("titleEn") || formData.get("titleFa")));
  if (RESERVED_SLUGS.has(slug)) throw new Error(`اسلاگ "${slug}" رزرو شده است و قابل استفاده نیست.`);

  await adminRpc<string>("admin_upsert_page", {
    p_data: {
      id,
      slug,
      titleFa: String(formData.get("titleFa") || ""),
      titleTr: String(formData.get("titleTr") || ""),
      titleEn: String(formData.get("titleEn") || ""),
      titleAr: String(formData.get("titleAr") || ""),
      contentFa: String(formData.get("contentFa") || ""),
      contentTr: String(formData.get("contentTr") || ""),
      contentEn: String(formData.get("contentEn") || ""),
      contentAr: String(formData.get("contentAr") || ""),
      template: String(formData.get("template") || "default"),
      isPublished: formData.get("isPublished") === "on",
      showInNav: formData.get("showInNav") === "on",
      navOrder: Number(formData.get("navOrder") || 0),
    },
  });

  revalidatePath("/admin/pages");
  revalidatePath("/", "layout");
  redirect("/admin/pages");
}

export async function deletePage(id: string) {
  await adminRpc<boolean>("admin_delete_page", { p_id: id });
  revalidatePath("/admin/pages");
  revalidatePath("/", "layout");
}
