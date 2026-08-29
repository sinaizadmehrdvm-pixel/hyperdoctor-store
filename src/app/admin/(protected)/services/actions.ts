"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import type { AdminLocale } from "@/lib/admin-i18n";
import { isValidSlug, RESERVED_SLUGS, slugify } from "@/lib/slug";
import { VERTICAL_OPTIONS } from "@/lib/verticals";

export type ServiceActionState = { error: string | null };

type ServiceMessages = {
  required: string;
  languages: string;
  slug: string;
  vertical: string;
  price: string;
  duration: string;
  generic: string;
};

const messages: Record<AdminLocale, ServiceMessages> = {
  fa: {
    required: "نام فارسی، نام انگلیسی و آدرس خدمت الزامی است.",
    languages: "برای انتشار، نام خدمت در هر چهار زبان الزامی است.",
    slug: "آدرس خدمت نامعتبر یا رزروشده است.",
    vertical: "حوزه فعالیت انتخاب‌شده معتبر نیست.",
    price: "قیمت باید خالی یا عددی بزرگ‌تر یا مساوی صفر باشد.",
    duration: "مدت زمان باید خالی یا یک عدد صحیح مثبت باشد.",
    generic: "ذخیره خدمت انجام نشد. لطفاً اطلاعات را بررسی و دوباره تلاش کنید.",
  },
  tr: {
    required: "Farsça ad, İngilizce ad ve hizmet adresi zorunludur.",
    languages: "Yayınlamak için hizmet adı dört dilde de zorunludur.",
    slug: "Hizmet adresi geçersiz veya ayrılmıştır.",
    vertical: "Seçilen faaliyet alanı geçersiz.",
    price: "Fiyat boş olmalı veya sıfır ya da daha büyük bir sayı olmalıdır.",
    duration: "Süre boş olmalı veya pozitif bir tam sayı olmalıdır.",
    generic: "Hizmet kaydedilemedi. Bilgileri kontrol edip tekrar deneyin.",
  },
  en: {
    required: "Persian name, English name and service URL are required.",
    languages: "Service names in all four languages are required for publishing.",
    slug: "The service URL is invalid or reserved.",
    vertical: "The selected business vertical is invalid.",
    price: "Price must be empty or a number greater than or equal to zero.",
    duration: "Duration must be empty or a positive integer.",
    generic: "The service could not be saved. Review the information and try again.",
  },
  ar: {
    required: "الاسم الفارسي والاسم الإنجليزي ورابط الخدمة مطلوبة.",
    languages: "يلزم اسم الخدمة باللغات الأربع للنشر.",
    slug: "رابط الخدمة غير صالح أو محجوز.",
    vertical: "مجال النشاط المحدد غير صالح.",
    price: "يجب أن يكون السعر فارغاً أو رقماً أكبر من أو يساوي صفراً.",
    duration: "يجب أن تكون المدة فارغة أو عدداً صحيحاً موجباً.",
    generic: "تعذر حفظ الخدمة. راجع المعلومات وحاول مرة أخرى.",
  },
};

export async function upsertService(_previous: ServiceActionState, formData: FormData): Promise<ServiceActionState> {
  const locale = await currentAdminLocale();
  const t = messages[locale];
  try {
    const nameFa = String(formData.get("nameFa") || "").trim();
    const nameTr = String(formData.get("nameTr") || "").trim();
    const nameEn = String(formData.get("nameEn") || "").trim();
    const nameAr = String(formData.get("nameAr") || "").trim();
    const slug = slugify(String(formData.get("slug") || nameEn || nameFa));
    const vertical = String(formData.get("vertical") || "RESPIRATORY_SERVICES");
    const isPublished = formData.get("isPublished") === "on";
    const priceRaw = String(formData.get("price") || "").trim();
    const durationRaw = String(formData.get("durationMinutes") || "").trim();
    const price = priceRaw === "" ? null : Number(priceRaw);
    const durationMinutes = durationRaw === "" ? null : Number(durationRaw);

    if (!nameFa || !nameEn || !slug) return { error: t.required };
    if (isPublished && (!nameTr || !nameAr)) return { error: t.languages };
    if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) return { error: t.slug };
    if (!VERTICAL_OPTIONS.some((item) => item.value === vertical)) return { error: t.vertical };
    if (price !== null && (!Number.isFinite(price) || price < 0)) return { error: t.price };
    if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes <= 0)) return { error: t.duration };

    await adminRpc("admin_upsert_service", {
      p_data: {
        id: String(formData.get("id") || ""),
        vertical,
        slug,
        nameFa,
        nameTr,
        nameEn,
        nameAr,
        descriptionFa: String(formData.get("descriptionFa") || "").trim(),
        descriptionTr: String(formData.get("descriptionTr") || "").trim(),
        descriptionEn: String(formData.get("descriptionEn") || "").trim(),
        descriptionAr: String(formData.get("descriptionAr") || "").trim(),
        image: String(formData.get("image") || "").trim(),
        price: price === null ? "" : String(price),
        priceIsFrom: formData.get("priceIsFrom") === "on",
        durationMinutes: durationMinutes === null ? "" : String(durationMinutes),
        requiresBooking: formData.get("requiresBooking") === "on",
        isPublished,
      },
    });
  } catch (error) {
    console.error("[admin/services] save failed", error);
    return { error: t.generic };
  }

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
