"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import type { AdminLocale } from "@/lib/admin-i18n";
import { isValidSlug, RESERVED_SLUGS, slugify } from "@/lib/slug";
import { VERTICAL_OPTIONS } from "@/lib/verticals";

export type CategoryActionState = { error: string | null };
const messages: Record<AdminLocale, Record<string, string>> = {
  fa: { required: "نام فارسی، نام انگلیسی و آدرس دسته‌بندی الزامی است.", languages: "برای انتشار، نام دسته‌بندی در هر چهار زبان الزامی است.", slug: "آدرس دسته‌بندی نامعتبر یا رزروشده است.", vertical: "حوزه فعالیت انتخاب‌شده معتبر نیست.", order: "ترتیب نمایش باید یک عدد صحیح بین ۰ تا ۱۰۰۰۰ باشد.", generic: "ذخیره دسته‌بندی انجام نشد. لطفاً اطلاعات را بررسی و دوباره تلاش کنید." },
  tr: { required: "Farsça ad, İngilizce ad ve kategori adresi zorunludur.", languages: "Yayınlamak için kategori adı dört dilde de zorunludur.", slug: "Kategori adresi geçersiz veya ayrılmıştır.", vertical: "Seçilen faaliyet alanı geçersiz.", order: "Görüntüleme sırası 0 ile 10000 arasında bir tam sayı olmalıdır.", generic: "Kategori kaydedilemedi. Bilgileri kontrol edip tekrar deneyin." },
  en: { required: "Persian name, English name and category URL are required.", languages: "Category names in all four languages are required for publishing.", slug: "The category URL is invalid or reserved.", vertical: "The selected business vertical is invalid.", order: "Display order must be an integer between 0 and 10000.", generic: "The category could not be saved. Review the information and try again." },
  ar: { required: "الاسم الفارسي والاسم الإنجليزي ورابط التصنيف مطلوبة.", languages: "يلزم اسم التصنيف باللغات الأربع للنشر.", slug: "رابط التصنيف غير صالح أو محجوز.", vertical: "مجال النشاط المحدد غير صالح.", order: "يجب أن يكون ترتيب العرض عدداً صحيحاً بين 0 و10000.", generic: "تعذر حفظ التصنيف. راجع المعلومات وحاول مرة أخرى." },
};

export async function upsertCategory(_previous: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  const locale = await currentAdminLocale();
  const t = messages[locale];
  try {
    const nameFa = String(formData.get("nameFa") || "").trim();
    const nameTr = String(formData.get("nameTr") || "").trim();
    const nameEn = String(formData.get("nameEn") || "").trim();
    const nameAr = String(formData.get("nameAr") || "").trim();
    const slug = slugify(String(formData.get("slug") || nameEn || nameFa));
    const isPublished = formData.get("isPublished") === "on";
    const vertical = String(formData.get("vertical") || "MEDICAL_EQUIPMENT");
    const order = Number(formData.get("order") || 0);
    if (!nameFa || !nameEn || !slug) return { error: t.required };
    if (isPublished && (!nameTr || !nameAr)) return { error: t.languages };
    if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) return { error: t.slug };
    if (!VERTICAL_OPTIONS.some((item) => item.value === vertical)) return { error: t.vertical };
    if (!Number.isInteger(order) || order < 0 || order > 10000) return { error: t.order };
    await adminRpc("admin_upsert_category", { p_data: { id: String(formData.get("id") || ""), vertical, slug, nameFa, nameTr, nameEn, nameAr, descriptionFa: String(formData.get("descriptionFa") || "").trim(), descriptionTr: String(formData.get("descriptionTr") || "").trim(), descriptionEn: String(formData.get("descriptionEn") || "").trim(), descriptionAr: String(formData.get("descriptionAr") || "").trim(), image: String(formData.get("image") || "").trim(), order, isPublished } });
  } catch (error) {
    console.error("[admin/categories] save failed", error);
    return { error: t.generic };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  const result = await adminRpc<{ ok: boolean; reason?: string | null; productCount?: number }>("admin_delete_category", { p_id: id });
  if (!result.ok && result.reason === "HAS_PRODUCTS") throw new Error("Category has products and cannot be deleted until they are moved.");
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}
