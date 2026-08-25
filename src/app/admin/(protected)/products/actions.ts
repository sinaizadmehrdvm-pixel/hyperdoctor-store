"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

async function requireAdmin() {
  const session = await auth();
  if (!session) redirect("/admin/login");
}

function optionalNumber(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : null;
}

function parseImages(value: FormDataEntryValue | null) {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(String(value));
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).map((url) => url.trim()).filter(Boolean).slice(0, 12);
  } catch {
    return [] as string[];
  }
}

export async function upsertProduct(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const nameFa = String(formData.get("nameFa") || "").trim();
  const nameTr = String(formData.get("nameTr") || "").trim();
  const nameEn = String(formData.get("nameEn") || "").trim();
  const nameAr = String(formData.get("nameAr") || "").trim();
  const sku = String(formData.get("sku") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();

  if (!nameFa || !nameEn || !sku || !categoryId) {
    throw new Error("نام فارسی، نام انگلیسی، SKU و دسته‌بندی الزامی هستند.");
  }

  const price = Number(formData.get("price") || 0);
  const stock = Number(formData.get("stock") || 0);
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) {
    throw new Error("قیمت و موجودی باید عدد معتبر و غیرمنفی باشند.");
  }

  const data = {
    vertical: String(formData.get("vertical")) as
      | "MEDICAL_EQUIPMENT"
      | "RESPIRATORY_SERVICES"
      | "DENTAL"
      | "VETERINARY"
      | "PHARMACY"
      | "NURSING",
    categoryId,
    slug: slugify(String(formData.get("slug") || nameEn || nameFa)),
    nameFa,
    nameTr,
    nameEn,
    nameAr,
    descriptionFa: String(formData.get("descriptionFa") || ""),
    descriptionTr: String(formData.get("descriptionTr") || ""),
    descriptionEn: String(formData.get("descriptionEn") || ""),
    descriptionAr: String(formData.get("descriptionAr") || ""),
    brand: String(formData.get("brand") || "").trim(),
    modelNumber: String(formData.get("modelNumber") || "").trim(),
    sku,
    barcode: String(formData.get("barcode") || "").trim(),
    gtin: String(formData.get("gtin") || "").trim(),
    manufacturer: String(formData.get("manufacturer") || "").trim(),
    countryOfOrigin: String(formData.get("countryOfOrigin") || "").trim(),
    price: Math.trunc(price),
    compareAtPrice: optionalNumber(formData.get("compareAtPrice")),
    costPrice: optionalNumber(formData.get("costPrice")),
    stock: Math.trunc(stock),
    lowStockThreshold: optionalNumber(formData.get("lowStockThreshold")) ?? 2,
    minOrderQty: optionalNumber(formData.get("minOrderQty")) ?? 1,
    maxOrderQty: optionalNumber(formData.get("maxOrderQty")),
    warrantyMonths: optionalNumber(formData.get("warrantyMonths")),
    specs: String(formData.get("specs") || "{}"),
    tags: String(formData.get("tags") || "[]"),
    seoTitleFa: String(formData.get("seoTitleFa") || ""),
    seoTitleTr: String(formData.get("seoTitleTr") || ""),
    seoTitleEn: String(formData.get("seoTitleEn") || ""),
    seoTitleAr: String(formData.get("seoTitleAr") || ""),
    seoDescriptionFa: String(formData.get("seoDescriptionFa") || ""),
    seoDescriptionTr: String(formData.get("seoDescriptionTr") || ""),
    seoDescriptionEn: String(formData.get("seoDescriptionEn") || ""),
    seoDescriptionAr: String(formData.get("seoDescriptionAr") || ""),
    isPublished: formData.get("isPublished") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isNewArrival: formData.get("isNewArrival") === "on",
  };

  const product = id
    ? await prisma.product.update({ where: { id }, data })
    : await prisma.product.create({ data });

  const imageUrls = parseImages(formData.get("imageUrls"));
  if (formData.has("imageUrls")) {
    await prisma.media.deleteMany({ where: { productId: product.id } });
    if (imageUrls.length) {
      await prisma.media.createMany({
        data: imageUrls.map((url, sortOrder) => ({
          url,
          sortOrder,
          productId: product.id,
          altFa: nameFa,
          altTr: nameTr || nameEn,
          altEn: nameEn,
          altAr: nameAr || nameFa,
        })),
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}
